const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const {
	addUser,
	removeUser,
	getUser,
	getAllUser,
	getUsersInRoom,
} = require("./users");
const PORT = process.env.PORT || 5000;

const router = require("./router");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(router);
app.use(cors());

io.on("connection", (socket) => {
	console.log("We have a new connection!!!");

	socket.on("join", ({ name, room }, callback) => {
		const { error, user } = addUser({ id: socket.id, name, room });

		if (error) {
			// console.log(error);
			return callback({ error: error });
		}

		// console.log(`welcome, ${name}`);
		// console.log(getAllUser());
		socket.emit("message", {
			user: "admin",
			text: `${user.name}, welcome to the room ${user.room}`,
		});

		socket.broadcast
			.in(user.room)
			.emit("message", { user: "admin", text: `${user.name} has joined!` });

		console.log(`room: '${room}'`, getUsersInRoom(room));
		socket.join(user.room);

		io.in(user.room).emit("roomData", {
			room: user.room,
			users: getUsersInRoom(user.room),
		});
	});

	socket.on("sendMessage", (message, callback) => {
		// const user = getUser(socket.id);
		// const users = getAllUser();
		// console.log(users, socket.id);
		// const finding = users.find((u) => {
		// 	u.id === socket.id;
		// 	return u;
		// });
		const finding = getUser(socket.id);
		// console.log(`Message was sent from ${finding.name}: ${message}`);
		if (finding) {
			console.log(finding.name, finding.room);
			io.to(finding.room).emit("message", {
				user: finding.name,
				text: message,
			});
		}
		callback();
	});

	socket.on("disconnect", () => {
		const user = removeUser(socket.id);

		if (user) {
			console.log(`user '${user.name} had left`);
			io.to(user.room).emit("message", {
				user: "admin",
				text: `${user.name} has left.`,
			});
			io.to(user.room).emit("roomData", {
				room: user.room,
				users: getUsersInRoom(user.room),
			});
		}
	});
});

server.listen(PORT, () =>
	console.log(`Server has started on port http://localhost:${PORT}/`)
);
