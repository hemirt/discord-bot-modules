var moduleFunction = async(client, moduleLoader, config) => {

    var { isObject, isClass } = require("./helpers")

    var TYPES = {
        STRING: typeof "",
        NUMBER: typeof 0,
        OBJECT: typeof {},
        FUNCTION: typeof
        function() {},
        BOOLEAN: typeof true,
        ANY: "%ANY%",
        UNDEFINED: typeof undefined,
        OPTIONAL: (classa) => {
            return new OptionalObjectDataModel(classa);
        }
    }

    class ObjectModelError extends Error {
        constructor(message) {
            super(message); // (1)
            this.name = "[OBJECTMODEL ERROR]"; // (2)
        }
    }

    class OptionalObjectDataModel {
        constructor(type) {
            this.type = type;
            return this;
        }
    }


    class ObjectDataModel {
        constructor(args = [], model = {}) {
            this.morph = this.morph.bind(this);
            this.model = model;

            if (args.length > 0)
                this.init(args);
        }

        init(args) {
            if (args.length > 0) {
                if (!this.compareModel(args))
                    throw new ObjectModelError("Morphable object does not equal to model");

                var index = 0;
                //todo: for proper usage of optional use .morph() or pass TYPES.UNDEFINED on place of optional argument to skip it
                for (var i in this.model) {
                    if (typeof args[index] === TYPES.UNDEFINED && this.model[i] != TYPES.UNDEFINED)
                        continue;
                    else
                        this[i] = args[index];
                    index++;
                }

                delete this.model;
                delete this.morph;
                delete this.init;
            }
        }


        morph(morphable, freeMorph = false) {
            if (!this.compareModel(morphable, freeMorph))
                throw new ObjectModelError("Morphable object does not equal to model");

            for (var i in this.model) {
                if (isClass(this.model[i].type)) {
                    this[i] = new this.model[i].type().morph(morphable[i]);
                } else if (this.model[i] instanceof OptionalObjectDataModel) {
                    if (typeof morphable[i] === TYPES.UNDEFINED)
                        continue;
                    else
                        this[i] = morphable[i];
                } else {
                    this[i] = morphable[i];
                }
            }

            delete this.model;
            delete this.morph;
            delete this.init;
            return this;
        }


        compareModel(morphable, freeMorph = false) {
            var isObjectBool = isObject(morphable);
            var morphableKeys = Object.keys(morphable);
            var modelKeys = Object.keys(this.model);
            var modelValues = Object.keys(this.model);

            if (!this.model)
                throw new ObjectModelError("No model is set, you cannot compare something that does not exist.");

            if (morphableKeys.length <= 0)
                throw new ObjectModelError("Morphable object has no keys set.");

            //check if keys sent from .morph object are equal to keys in model
            if (isObjectBool) {
                for (var i in modelKeys) {
                    if (!morphableKeys.includes(modelKeys[i]) && !modelValues[i] instanceof OptionalObjectDataModel) {
                        throw new ObjectModelError("Model key mismatch.");
                    }
                }
            }

            var index = -1;
            for (var i in this.model) {
                index++;
                var val = (isObjectBool ? morphable[i] : morphable[index]);
                if (typeof this.model[i] === TYPES.OBJECT) {
                    if (!this.model[i].type instanceof OptionalObjectDataModel)
                        throw new ObjectModelError("Model object is primitive, needs to be instanceof OptionalObjectDataModel");
                    else {
                        if (typeof val === TYPES.UNDEFINED)
                            continue;
                        else if (isClass(this.model[i].type)) {
                            if (val instanceof this.model[i].type || freeMorph)
                                continue;
                        } else if (typeof val === this.model[i].type)
                            continue;
                    }
                } else if (this.model[i] === typeof val || this.model[i] === TYPES.ANY) {
                    continue;
                }
                throw new ObjectModelError("Morphable cannot be applied to model.");
            }
            return true;
        }

        applyValues(that) {
            Object.keys(this).map((key, index) => {
                that[key] = this[key];
            });
        }
    }

    return {
        name: "Object Model System",
        exports: {
            ObjectDataModel: ObjectDataModel,
            TYPES: TYPES
        },
        unload: async() => {
            return true;
        }
    }

}

module.exports = {
    module: moduleFunction,
    requires: [],
    code: "OBJMDL.JS"
}