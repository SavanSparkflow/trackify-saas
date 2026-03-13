const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // allow all in dev
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected", socket.id);

        socket.on("join_company", (companyId) => {
            socket.join(companyId.toString()); // Join a room for that company
            console.log(`Socket joined company room: ${companyId}`);
        });

        socket.on("join_user", (userId) => {
            socket.join(userId.toString()); // Join a room for that specific user
            console.log(`Socket joined user room: ${userId}`);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected", socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

// Simplified utility to emit to a company
const emitToCompany = (companyId, event, data) => {
    if (io) {
        io.to(companyId.toString()).emit(event, data);
        console.log(`Emitting ${event} to ${companyId}`);
    }
};

const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(userId.toString()).emit(event, data);
        console.log(`Emitting ${event} to user ${userId}`);
    }
};

module.exports = { initSocket, getIO, emitToCompany, emitToUser };
