var moduleFunction = async(client, moduleLoader, config) => {

    var { arrayContainsArray } = require("./helpers")
    const fs = require("fs");

    class PermissionRoles {
        constructor() {
            this.load = this.load.bind(this);
            this.getRolePermissions = this.getRolePermissions.bind(this);

            this.roles = {};
            this.adminPrivilege = false;
            this.defaultRole = false;

            this.load();
            return this;
        }

        load() {
            let jsonData = require('./Permissions/Roles.json');
            if (jsonData) {
                this.roles = jsonData.Roles;
                this.adminPrivilege = jsonData.adminPrivilege;
                this.defaultRole = jsonData.defaultRole;
            } else
                throw new Error("ROLES LOADING ERROR")
        }

        getRolePermissions(role) {
            if (role in this.roles)
                return this.roles[role];

            return false;
        }

    }

    class PermissionSystem {
        constructor() {
            this.users = {};
            this.load = this.load.bind(this);
            this.permissionRoles = new PermissionRoles();
            this.roles = this.permissionRoles.roles;
            this.delUserRole = this.delUserRole.bind(this);
            this.save = this.save.bind(this);
            this.load = this.load.bind(this);
            this.getUser = this.getUser.bind(this);
            this.setUserRole = this.setUserRole.bind(this);
            this.checkUserPermission = this.checkUserPermission.bind(this);
            this.load();

            return this;
        }

        load() {
            let jsonData = require('./Permissions/Users.json');
            if (!jsonData)
                throw new Error("USERS LOADING ERROR")


            for (var i in jsonData) {
                if (!(jsonData[i] in this.roles)) {
                    delete jsonData[i];
                    console.error("USER " + i + " HAD INCORRECT GROUP, REMOVING USER")
                }
            }

            this.users = jsonData;
        }

        save() {
            fs.writeFileSync(__dirname + '/Permissions/Users.json', JSON.stringify(this.users), 'utf8');
            return true;
        }

        getUser(userID) {
            if (userID in this.users)
                return this.users[userID];

            return this.permissionRoles.defaultRole;
        }

        setUserRole(userID, role) {
            var rolePermissions = this.permissionRoles.getRolePermissions(role);

            if (!rolePermissions)
                return false;

            this.users[userID] = role;
            this.save();
        }

        delUserRole(userID) {
            if (!userID in this.users)
                return false;

            delete this.users[userID];
            this.save();
            return true;
        }

        checkUserPermission(userID, neededPermissions) {
            var permissions = this.permissionRoles.getRolePermissions(this.getUser(String(userID)));

            if (!permissions)
                return false;

            if (permissions.length === 0 && neededPermissions.length > 0)
                return false;

            if (permissions.includes(this.permissionRoles.adminPrivilege))
                return true;

            if (arrayContainsArray(neededPermissions, permissions))
                return true;

            return false;
        }
    }

    var permissionMiddleWare = (permissions) => {
        return (client, message, next) => {
            if (permissionSystem.checkUserPermission(message.author.id, permissions))
                next();
        }
    }

    var permissionSystem = new PermissionSystem();

    return {
        name: "Permission System",
        exports: {
            permissionSystem: permissionSystem,
            permissionMiddleWare: permissionMiddleWare
        },
        unload: async() => {
            delete permissionSystem;

            return true;
        }
    }

}

module.exports = {
    module: moduleFunction,
    requires: [],
    code: "PERMISSIONS.JS"
}