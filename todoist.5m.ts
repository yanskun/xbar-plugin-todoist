#!/usr/bin/env -S -P/${HOME}/.deno/bin:/opt/homebrew/bin deno run --allow-env --allow-read --allow-net

// <xbar.title>Todoist Status</xbar.title>
// <xbar.desc>Display your Todoist tasks in your menubar</xbar.desc>
// <xbar.version>v1.0.0</xbar.version>
// <xbar.author>yanskun</xbar.author>
// <xbar.dependencies>deno</xbar.dependencies>
// <xbar.var>string(TODOIST_TOKEN=""): Your Todoist personal access token</xbar.var>

import {
  isDarkMode,
  separator,
  xbar,
} from "https://deno.land/x/xbar@v2.1.0/mod.ts";

const darkMode = await isDarkMode();
const config = {
  image:
    "iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAYAAAA71pVKAAAACXBIWXMAAAAAAAAAAQCEeRdzAAAABGNJQ1ABBAABk7gAvQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABGdBTUEAALGPC/xhBQAAAc1JREFUeJydk8trE1EUxudv6K5/gbZoY2JQYhuTJtWgBpKFSWkhLtq6EHWRRUUXQqEIKrSC2QhudCEhC0VXLgWxVFHoootSSq2ZO5k8ZshE82we/Tz3joW8TKGLCxfu+X3nO48rhYeHItsuS1b1noXitR15eByP55xEl0Lukh2KpzuQxDxWMNdY5xvdeTznJJGxB7SBOU9BcZ9BJhKAcvlcjwDnJDY+CmXSamaiw1wWyI6TyM6HUNv4joaSRHrmqumgK4FkPHskYC7CCFIDLpTeJ3BQKaP4Lo6U3wl28fQ/8S64kWKo72xBi96EsbKMViGP2o+vyMxdh/4wisqXT0hPXxGOeuDMrB+/X8ZwUK2QRRn6g7sC5ALNvC4ERc2itC64qWvIP10idR/SJFR8+8a0nHgNNehG5gY1zHe+b1Ml7f4dkbGR/ImmnkP12xqJXEN2IYz9rU005L3/2y7EnlBTJmA8fwydhNTgJMofP4gy/sRfiTcT7NOwOmXk6triLRgk1CoVUV3/LOYrO06A0az7gQJWpuwovFgVUP3XLrR7t82xOfuPpwNWaQXlCyPCbooaI5bGYxsMHm7Y4W4zt6Vt0wZ8jvbdPu6vChH3F2W1QAXIOeg0AAAAAElFTkSuQmCC",
  token: Deno.env.get("TODOIST_TOKEN"),
};

const restApiEndpoint = "https://api.todoist.com/rest/v2/";

type ApiTask = {
  content: string;
  description: string;
  due: {
    date: string;
  };
  url: string;
};

type Task = {
  name: string;
  description: string;
  dueDate?: string;
  url: string;
  isDueToday: boolean;
};

const mappedTaks = (task: ApiTask): Task => {
  const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
  return {
    name: task.content,
    description: task.description,
    dueDate: task.due?.date || undefined,
    url: task.url,
    isDueToday: task.due?.date === today,
  };
};

function getAllTasks(): Promise<Task[]> {
  const response = fetch(`${restApiEndpoint}tasks`, {
    method: "GET", // HTTPメソッド
    headers: {
      "Authorization": `Bearer ${config.token}`,
    },
  })
    .then((response) => response.json())
    .then((data) => data.map(mappedTaks))
    .catch((error) => {
      console.error("Error:", error);
      return [];
    });
  return response;
}

type MenuTask = {
  text: string;
  href: string;
  color: string;
};
type TaskGroup = {
  text: string; // Due date
  submenu: MenuTask[];
};

function groupByDueDate(tasks: Task[]): TaskGroup[] {
  const today = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().slice(0, 10); // Get tomorrow's date in YYYY-MM-DD format
  const overdueTasks = tasks.filter((task) =>
    !task.dueDate || task.dueDate && task.dueDate < today
  ).map((task) => {
    return {
      ...task,
      text: `${task.name}${task.dueDate && ` (${task.dueDate})`}`,
    };
  });
  const todayTasks = tasks.filter((task) => task.dueDate === today);
  const tomorrowTasks = tasks.filter((task) => task.dueDate === tomorrowDate);
  const futureTasks = tasks.filter((task) =>
    task.dueDate && task.dueDate > tomorrowDate
  );
  return [
    {
      text: "Overdue",
      submenu: overdueTasks.map(mappedMenuTask),
    },
    {
      text: "Today",
      submenu: todayTasks.map(mappedMenuTask),
    },
    {
      text: "Tomorrow",
      submenu: tomorrowTasks.map(mappedMenuTask),
    },
    {
      text: "Future",
      submenu: futureTasks.map(mappedMenuTask),
    },
  ];
}

function mappedMenuTask(task: Task) {
  return {
    text: task.name,
    href: task.url,
    color: darkMode ? "white" : "red",
  };
}

const tasks = await getAllTasks();

const title = {
  image: config.image,
  text: `${tasks.length} tasks`,
  color: darkMode ? "white" : "red",
};
xbar([
  title,
  separator,
  ...groupByDueDate(tasks),
]);
