var moduleFunction = async(client, moduleLoader, config) => {
    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    var { isArray, chunkify, sleep } = require("./helpers")
    const uuidv4 = require('uuid/v4');

    class taskQueue {
        constructor(rate, time) {
            this.working = false;

            this.queue = [];

            this.rate = rate;
            this.time = time;

            this.addTask = this.addTask.bind(this);
            this.start = this.start.bind(this);
            this.cycle = this.cycle.bind(this);

            this.start();
        }

        async addTask(taskFc, expectsReturn = false) {
            var task = new Task(taskFc);

            this.queue.push(task);
            if (expectsReturn) {
                return await new Promise((resolve, reject) => {
                    eventEmitter.once(task.ts, (result, err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    })
                })
            }

            return true;
        }

        async start() {
            while (true) {
                await this.cycle();
            }
        }


        async cycle() {
            if (this.queue.length == 0) {
                await sleep(200);
            }

            var chunks = chunkify(this.queue, this.rate);
            for (var chunk of chunks) {

                var start = Date.now();
                for (const [index, task] of chunk.entries()) {
                    var result = await task.do();
                    this.queue.splice(index, 1);
                    eventEmitter.emit(task.ts, result, false)
                }

                var end = Date.now();

                if ((end - start) < ((this.time * 1000) / chunk.length))
                    await sleep(this.time * 1000 - (end - start));

            }

        }
    }

    class Task {
        constructor(task) {
            this.task = task;
            this.ts = uuidv4();
            this.do = this.do.bind(this);

            return this;
        }

        async do() {
            return await this.task();
        }
    }

    return {
        name: 'Task Queue System',
        exports: {
            taskQueue,
            Task
        },
        unload: async() => {
            return true;
        },
    };
};

module.exports = {
    module: moduleFunction,
    requires: [],
    code: 'TASKQUEUE.JS',
};