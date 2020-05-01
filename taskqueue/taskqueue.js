var moduleFunction = async(client, moduleLoader, config) => {
    var events = require('events');
    var eventEmitter = new events.EventEmitter();
    var { isArray, chunkify, sleep, asyncForEach } = require("./plugins/helpers")
    const uuidv4 = require('uuid/v4');
    const { performance } = require('perf_hooks');

    class taskQueue {
        constructor(rate, time) {
            this.working = false;

            this.queue = [];

            this.rate = rate;
            this.time = time;
            this.uphead = 0;
            this.pastTasks = 0;

            this.addTask = this.addTask.bind(this);
            this.start = this.start.bind(this);
            this.cycle = this.cycle.bind(this);
            this.hookOnce = this.hookOnce.bind(this);


            this.start();
        }

        async addTask(taskFc, expectsReturn = false) {
            var returnTask = null;
            if (isArray(taskFc)) {
                returnTask = [];
                taskFc.forEach(singletask => {
                    var task = new Task(singletask);
                    returnTask.push(task.ts)
                    this.queue.push(task);
                });
            } else {
                var task = new Task(taskFc);
                returnTask = task.ts;
                this.queue.push(task);
            }

            if (expectsReturn) {
                if (isArray(taskFc)) {
                    return await Promise.all(returnTask.map(id => {
                        return this.hookOnce(id);
                    }))
                } else {
                    return await this.hookOnce(returnTask);
                }
            }

            return true;
        }

        hookOnce(id) {
            return new Promise((resolve, reject) => {
                eventEmitter.once(id, (result, err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                })
            })
        }

        async start() {
            while (true) {
                await this.cycle();
            }
        }


        async cycle() {
            await asyncForEach(this.queue, async(task, index) => {
                var a = performance.now();

                var result = await task.do();
                this.pastTasks++;
                this.queue.splice(index, 1);
                eventEmitter.emit(task.ts, result, false)

                var b = performance.now();
                this.uphead += b - a;

                if (this.pastTasks >= this.rate) {
                    var sleepTime = this.time - this.uphead;

                    this.uphead = 0;
                    this.pastTasks = 0;

                    if (sleepTime < 5000 && sleepTime > 0)
                        await sleep(sleepTime);
                }

            });
            if (this.queue.length === 0)
                await sleep(100)

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