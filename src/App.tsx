import {ChangeEvent, Dispatch, SetStateAction, useState} from 'react'
import './App.css'

/** TODO
 * read through React new docs and list out possible improvements
 * refactor
 * styles (tailwind?)
 * include it in my website? or keep it in separate link?
*/

/** Improvements list
 * helpers for localstorage
 * YAGNI (not-done class for example)
 * favicon
 * metadata (title etc)
 */

const LS_TODOS_KEY = 'mz_todos';
const LS_SCORES_KEY = 'mz_scores';

type Todo = {
    text: string,
    isDone: boolean,
}
function App() {
    const [isEditing, setIsEditing] = useState(false);
    const [todos, setTodos] = useState(getTodos());
    const [isManaging, setIsManaging] = useState(false);

  return (
    <div className="App">
        <Score />
        <div className="container">
            {todos.map((todo, index) => {
                function setIsDone() {
                    const updatedTodos = [...todos];
                    updatedTodos[index].isDone = !updatedTodos[index].isDone;
                    setTodos(updatedTodos);
                    window.localStorage.setItem(LS_TODOS_KEY, JSON.stringify(updatedTodos));
                }

                function setTodo(event: ChangeEvent<HTMLInputElement>) {
                     const updatedTodos = [...todos];
                    updatedTodos[index].text = event.target.value ?? '';
                    setTodos(updatedTodos);
                }

                function removeTodo() {
                   setTodos(todos => todos.filter((todo, currentIndex) => currentIndex !== index))
                }

                function moveTodo(direction: -1 | 1) {
                    if ((index === 0 && direction === -1) || (index === todos.length - 1 && direction === 1)) {
                        return;
                    }

                    const updatedTodos = [...todos];
                    const todo = updatedTodos[index];
                    updatedTodos.splice(index, 1);
                    updatedTodos.splice(index + direction, 0, todo);
                    setTodos(updatedTodos);
                }

                return <TodoItem
                    todo={todo.text}
                    isDone={todo.isDone}
                    setIsDone={setIsDone}
                    isEditing={isEditing}
                    setTodo={setTodo}
                    key={index}
                    removeTodo={removeTodo}
                    moveTodo={moveTodo}
                />
            })}
            <AddTodo isEditing={isEditing} setTodos={setTodos}/>
            <div className="divider"></div>
            <div className="buttons">
                <Save todos={todos} setTodos={setTodos}/>
                <button onClick={() => setIsManaging(!isManaging)}>{isManaging ? "hide" : 'manage'}</button>
                {isManaging && <>
                    <Export />
                    <Import setTodos={setTodos}/>
                    <Edit isEditing={isEditing} setIsEditing={setIsEditing} todos={todos}/>
                </>}
            </div>
        </div>
    </div>
  )
}

function Score() {
    const scores = window.localStorage.getItem(LS_SCORES_KEY);
    const parsedScores = scores === null || scores === '' ? [] : JSON.parse(scores);
    const rawResult = parsedScores.length === 0 ? 100 : (parsedScores.map((score: { score: number, date: string }) => score.score).reduce((sum: number, value: number) => sum + value, 0)) / parsedScores.length;
    const result = rawResult.toFixed(2);
    return (
       <div className="score">
           <div className="score__yes" style={{width: `${result}%`}}></div>
           <div className="score__no"></div>
           <div className="score__result">{result}%</div>
       </div>
   );
}

type TodoItemProps = {
    todo: string,
    isDone: boolean,
    isEditing: boolean,
    setIsDone: () => void,
    setTodo: (event: ChangeEvent<HTMLInputElement>) => void,
    removeTodo: () => void,
    moveTodo: (direction: -1 | 1) => void,
}
function TodoItem({todo, isDone,  isEditing, setIsDone, setTodo, removeTodo, moveTodo}: TodoItemProps) {
    return isEditing ? (
       <div className="todo-item">
            <label>
               <input type="text" onChange={setTodo} value={todo}/>
           </label>
           <button onClick={() => moveTodo(-1)}>▲</button>
           <button onClick={() => moveTodo(1)}>▼</button>
           <button onClick={removeTodo}>×</button>
       </div>
    ) : (
        <div className={`${isDone ? "done" : "not-done"} todo-item`}>
           <label>
               <input type="checkbox" checked={isDone} onChange={setIsDone}/>
               {todo}
           </label>
        </div>
    );
}

type AddTodoProps = {
    isEditing: boolean,
    setTodos: Dispatch<SetStateAction<Array<Todo>>>
}
function AddTodo({isEditing, setTodos}: AddTodoProps) {
    function addTodo() {
        setTodos(todos => [...todos, {text: '', isDone: false}]);
    }
    return isEditing ? (
        <button onClick={addTodo}>+</button>
    ) : (
        <></>
    );
}

type ImportProps = {
    setTodos: Dispatch<SetStateAction<Array<Todo>>>
}
function Import({setTodos}: ImportProps) {
    const [file, setFile] = useState<File>();
    const [fileInputKey, setFileInputKey] = useState(Date.now());
     return (
         <form id="upload" onSubmit={(event) => {
             event.preventDefault();

             if (file === undefined) {
                 return;
             }

             const reader = new FileReader();

             reader.onload = (event) => {
                 if (event.target === null) {
                     return;
                 }

                 if (typeof event.target.result !== "string") {
                    return;
                 }

                 const result = JSON.parse(event.target.result);
                 console.log(result);

                 if (result.scores) {
                    window.localStorage.setItem(LS_SCORES_KEY, JSON.stringify(result.scores));
                 }

                 if (result.todos) {
                     window.localStorage.setItem(LS_TODOS_KEY, JSON.stringify(result.todos));
                     setTodos(result.todos);
                 }

                 setFileInputKey(Date.now());
             };

             reader.readAsText(file);

         }}>
             <input type="file" id="file" accept=".json" key={fileInputKey} onChange={(event) => {
                 console.log(event);
                    if (event.target.files !== null) {
                        setFile(event.target.files[0])}
                    }
             }/>
                 <button disabled={!file}>import</button>
         </form>
    );
}

function Export() {
    return (
        <button
            onClick={() => {
    const todos = window.localStorage.getItem(LS_TODOS_KEY);
    const scores = window.localStorage.getItem(LS_SCORES_KEY);
    const data: {
        todos?:Array<Todo>,
        scores?: Array<{score: number, date: string}>,
    } = {};

    if (todos !== null && todos !== '') {
        data.todos = JSON.parse(todos);
    }
    if (scores !== null && scores !== '') {
        data.scores = JSON.parse(scores);
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download","todos.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
        }}
        >
            export
        </button>
    );
}

type SaveProps = {
    todos: Array<Todo>,
    setTodos:  Dispatch<SetStateAction<Array<Todo>>>
};
function Save({todos, setTodos}: SaveProps) {
    const [date, setDate] = useState('');

    function saveScore() {
        const accomplished = todos.filter(todo => todo.isDone).length;
        const score = (accomplished / todos.length) * 100;

        const scores = window.localStorage.getItem(LS_SCORES_KEY);
        const parsedScores = scores === null || scores === '' ? [] : JSON.parse(scores);

        const duplicate = parsedScores.find((score: { score: number, date: string }) => score.date === date);
        if (duplicate === undefined) {
            parsedScores.push({score, date});
        } else {
            duplicate.score = score;
        }

        window.localStorage.setItem(LS_SCORES_KEY, JSON.stringify(parsedScores));

        setTodos(todos => {
            const newTodos = todos.map(todo => {
                todo.isDone = false;
                return todo;
            });

            window.localStorage.setItem(LS_TODOS_KEY, JSON.stringify(newTodos));

            return newTodos;
        });
    }

    return (
        <div className="save">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value) }/>
            <button onClick={saveScore} disabled={date === ''}>save</button>
        </div>
    );
}

type EditProps = {
    isEditing: boolean,
    setIsEditing: Dispatch<SetStateAction<boolean>>,
    todos: Array<Todo>,
}
function Edit({isEditing, setIsEditing, todos}: EditProps) {
    return (
       <button className="edit" onClick={() => {
           setIsEditing(!isEditing);
           window.localStorage.setItem(LS_TODOS_KEY, JSON.stringify(todos));
       }}>{isEditing ? "stop editing" : "edit" }</button>
    );
}

function getTodos(): Array<Todo> {
    const todos = window.localStorage.getItem(LS_TODOS_KEY);

    if (todos === null || todos === '') {
        const defaultTodos = [
        {
            text: 'todo 1',
            isDone: false,
        },
        {
            text: 'todo 2',
            isDone: false,
        },
        ];

        window.localStorage.setItem(LS_TODOS_KEY, JSON.stringify(defaultTodos));
        return defaultTodos;
    }

    return JSON.parse(todos);
}
export default App
