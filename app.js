const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
var isMatch = require("date-fns/isMatch");
var isValid = require("date-fns/isValid");
const path = require("path");

const app = express();

let database;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const result = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

//Get API 1

app.get("/todos/", async (request, response) => {
  let data;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  switch (true) {
    // Scenario 3
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachTodos) => result(eachTodos)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario 5
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachTodos) => result(eachTodos)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 7
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(data.map((eachTodos) => result(eachTodos)));
        } else {
          response.status(400);
          response.send("Invalid Todo priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 1
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachTodos) => result(eachTodos)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //Scenario 2
    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachTodos) => result(eachTodos)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario 4
    case hasSearch(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo like '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(data.map((eachTodos) => result(eachTodos)));
      break;

    //Scenario 6
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
        data = await database.all(getTodosQuery);
        response.send(data.map((eachTodos) => result(eachTodos)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Default get all todos
    default:
      getTodosQuery = `SELECT * FROM todo;`;
      data = await database.all(getTodosQuery);
      response.send(data.map((eachTodos) => result(eachTodos)));
  }
});

//Get Todo API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(result(todo));
});

//Get Todo API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`;
    const todo = await database.all(getTodoQuery);
    response.send(todo.map((eachTodo) => result(eachTodo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//Post Todo API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const postTodoQuery = `
                    INSERT INTO
                      todo (todo, priority, status, category, due_date)
                    VALUES ('${todo}', '${priority}', '${status}', '${category}', '${newDate}');`;
          await database.run(postTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Priority");
  }
});

//Put Todo API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = requestBody;

  let updateTodoQuery;
  switch (true) {
    //Scenario 1
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodoQuery = `
                UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}',
                category = '${category}', due_date = '${dueDate}'  WHERE id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    //Scenario 2
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodoQuery = `
                UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}',
                  category = '${category}', due_date = '${dueDate}'  WHERE id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //Scenario 3
    case requestBody.todo !== undefined:
      updateTodoQuery = `
                UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}',
                  category = '${category}', due_date = '${dueDate}'  WHERE id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send("Todo Updated");
      break;

    //Scenario 4
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateTodoQuery = `
                UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}',
                  category = '${category}', due_date = '${dueDate}'  WHERE id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    //Scenario 5
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDueDate = format(new Date(dueDate), "yyyy-MM-dd");
        updateTodoQuery = `
                UPDATE todo SET todo = '${todo}', priority = '${priority}', status = '${status}',
                  category = '${category}', due_date = '${newDueDate}'  WHERE id = ${todoId};`;
        await database.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Due Date");
      }
      break;
  }
});

//Delete Todo API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
