const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
    circuitGraph: {
        models: {
            type: Map,
            of: {
                type: {
                    type: String,
                    required: true
                },
                value: Number,
                position: {
                    x: Number,
                    y: Number
                }
            }
        },
        nodes: [Array],
        numOfNodes: Number,
        numOfVSources: Number
    }
});

const itemModel = mongoose.model("Item", itemSchema)

module.exports = itemModel