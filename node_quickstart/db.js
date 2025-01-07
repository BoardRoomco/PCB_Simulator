const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            'mongodb+srv://testnain:cat@boardroom.fmha7.mongodb.net/?retryWrites=true&w=majority&appName=BoardRoom', 
            {
            useNewUrlParser: true,
            useUnifiedTopology: true

        });
        console.log('MongoDB Connected: ${conn.connection.host}');
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
};

module.exports = connectDB;