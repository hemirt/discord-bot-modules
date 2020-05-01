        String.prototype.hashCode = function() {
            var hash = 0;
            if (this.length == 0) {
                return hash;
            }
            for (var i = 0; i < this.length; i++) {
                var char = this.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        }
        async function asyncForEach(array, callback) {
            for (let index = 0; index < array.length; index++) {
                await callback(array[index], index, array);
            }
        }

        var armoryTemplate = function(id) {
            return `
        <section class="armory" id="${id}">
            <section class="armory_left">
                <div class="item Head item-over">
                    <img src="./assets/Head.png">
                </div>

                <div class="item Neck item-over">
                    <img src="./assets/Neck.png">
                </div>

                <div class="item Shoulder item-over">
                    <img src="./assets/Shoulder.png">
                </div>

                <div class="item Back item-over">
                    <img src="./assets/Back.png">
                </div>

                <div class="item Chest item-over">
                    <img src="./assets/Chest.png">
                </div>

                <div class="item Shirt item-over">
                    <img src="./assets/Shirt.png">
                </div>

                <div class="item Tabard item-over">
                    <img src="./assets/Tabard.png">
                </div>

                <div class="item Wrists item-over">
                    <img src="./assets/Wrists.png">
                </div>
            </section>

            <section class="armory_center">
                <section class="top">
                    Data
                </section>
                <div class="bottom">
                    <div class="item WeaponLeft item-over">
                        <img src="./assets/WeaponLeft.png">
                    </div>

                    <div class="item WeaponRight item-over">
                        <img src="./assets/WeaponRight.png">
                    </div>

                    <div class="item Ranged item-over">
                        <img src="./assets/Ranged.png">
                    </div>
                </div>
            </section>

            <section class="armory_right">
                <div class="item Hands item-over">
                    <img src="./assets/Hands.png">
                </div>

                <div class="item Waist item-over">
                    <img src="./assets/Waist.png">
                </div>

                <div class="item Legs item-over">
                    <img src="./assets/Legs.png">
                </div>

                <div class="item Feet item-over">
                    <img src="./assets/Feet.png">
                </div>

                <div class="item Finger1 item-over">
                    <img src="./assets/Finger.png">
                </div>

                <div class="item Finger2 item-over">
                    <img src="./assets/Finger.png">
                </div>

                <div class="item Trinket1 item-over">
                    <img src="./assets/Trinket.png">
                </div>

                <div class="item Trinket2 item-over">
                    <img src="./assets/Trinket.png">
                </div>
            </section>
        </section>`
        }

        var tableTemplate = function(id) {
            return `
        <div class="display-parent" id="${id}">
            <div class="display-item display-item-title">
                ...
            </div>
            <div class="display-item WeaponLeft item-over">
                ...
            </div>
            <div class="display-item WeaponRight item-over">
                ...
            </div>
            <div class="display-item Ranged item-over">
                ...
            </div>
            <div class="display-item Head item-over">
                ...
            </div>
            <div class="display-item Neck item-over">
                ...
            </div>
            <div class="display-item Shoulder item-over">
                ...
            </div>
            <div class="display-item Back item-over">
                ...
            </div>
            <div class="display-item Chest item-over">
                ...
            </div>
            <div class="display-item Wrists item-over">
                ...
            </div>
            <div class="display-item Hands item-over">
                ...
            </div>
            <div class="display-item Waist item-over">
                ...
            </div>
            <div class="display-item Legs item-over">
                ...
            </div>
            <div class="display-item Feet item-over">
                ...
            </div>
            <div class="display-item Finger1 item-over">
                ...
            </div>
            <div class="display-item Finger2 item-over">
                ...
            </div>
            <div class="display-item Trinket1 item-over">
                ...
            </div>
            <div class="display-item Trinket2 item-over">
                ...
            </div>
        </div>`
        }

        class Armory {

            constructor(user, template) {
                this.user = user;
                this.base64user = btoa(this.user).split("=").join("");
                this.itemData = {

                };
                this.characterData = false;

                this.itemSlots = {
                    0: "NonEquippable",
                    1: "Head",
                    2: "Neck",
                    3: "Shoulder",
                    4: "Shirt",
                    5: "Chest",
                    6: "Waist",
                    7: "Legs",
                    8: "Feet",
                    9: "Wrists",
                    10: "Hands",
                    11: "Finger",
                    12: "Trinket",
                    13: "WeaponLeft",
                    14: "WeaponRight",
                    15: "Ranged",
                    16: "Back",
                    17: "WeaponLeft",
                    18: "Bag",
                    19: "Tabard",
                    20: "Chest",
                    21: "WeaponLeft",
                    22: "WeaponRight",
                    23: "WeaponRight",
                    24: "Ammo",
                    25: "Ranged",
                    26: "Ranged",
                    27: "Quiver",
                    28: "Relic",
                }

                this.getCharacterData = this.getCharacterData.bind(this);
                this.recentEncounter = this.recentEncounter.bind(this);
                this.getItemSlot = this.getItemSlot.bind(this);
                this.getOutput = this.getOutput.bind(this);
                this.template = template;
                this.init = this.init.bind(this);
                this.unbind = [];

                this.init();
            }

            async init(id) {
                if (!this.characterData)
                    await this.getCharacterData();

                if (!id) {
                    this.data = this.recentEncounter();
                    id = 0;
                } else {
                    this.data = this.characterData[id];
                }
                if (!this.data) {
                    $("#" + this.base64user).remove();
                    return false;
                }

                var fingerOffset = 1;
                var trinketOffset = 1;
                var weaponRight = false;

                function offset(elem) {
                    if (!elem) elem = this;

                    var x = elem.offsetLeft;
                    var y = elem.offsetTop;

                    while (elem = elem.offsetParent) {
                        x += elem.offsetLeft;
                        y += elem.offsetTop;
                    }

                    return {
                        left: x,
                        top: y,
                    };
                }

                this.unbind.push(() => {
                    $("#" + this.base64user + " .item-over").off();
                })

                this.unbind.push(() => {
                    $("body").off();
                })

                $("#" + this.base64user + " .item-over").mouseenter((event) => {


                    //var pos = offset(event.currentTarget);
                    var id = event.currentTarget.attributes.itemid;

                    if (!id)
                        return false;

                    if (id) {
                        $("#tooltip").show();
                        $("#tooltip").html('<div class="wowhead-tooltip wowhead-tooltip-width-restriction wowhead-tooltip-width-320"style="width: 320px; visibility: visible;">' + this.itemData[id.value].tooltip + '</div>')
                    }

                    var itemSets = ISM.returnItemSets();

                    if (id.value in itemSets) {
                        //update how many pieces from set bonus he has
                        var bonus = $("#tooltip div table:nth-child(2) tbody tr td .q");
                        bonus.html(bonus.html().replace("0/", itemSets[id.value] + "/"))

                        //update which pieces he has
                        $("#tooltip div table:nth-child(2) tbody tr td .q0.indent").children().each(function(index) {
                            var id = $(this).find("a").attr("href");
                            if (id) {
                                var link = id.split("=")[1];

                                if (link in itemSets) {
                                    $(this).attr("class", "q13");
                                }
                            }
                        });

                        //highlight itemset bonuses
                        for (var i = 1; i < 9; i++) {
                            if (itemSets[id.value] >= i)
                                $(".q0 span:contains('(" + i + ") Set ')").attr("class", "q2")
                        }
                    }
                });


                $("#" + this.base64user + " .item-over").mouseleave((event) => {
                    $("#tooltip").hide();
                });

                $("body").mousemove(function(e) {
                    //calculate offsets/position
                    var offset = 10;

                    var width = $("#tooltip").width();
                    var height = $("#tooltip").height();

                    var windowWidth = $(window).width();
                    var windowHeight = $(window).height();

                    var top = e.pageY + offset;
                    var left = e.pageX + offset;

                    if ((top + height + offset) > windowHeight)
                        top = e.pageY - height - offset;

                    if ((left + width + offset) > windowWidth)
                        left = e.pageX - width + offset;

                    if (top < 0)
                        top = 0 + offset;

                    if (left < 0)
                        left = 0 + offset;


                    $("#tooltip").css({
                        top,
                        left
                    });
                })



                var itemIdArray = this.data.gear.map(item => item.id);
                const response = await fetch('itemtooltiparray/' + JSON.stringify(itemIdArray));
                const json = await response.json();

                if (this.template == "armory") {
                    $("#" + this.base64user + " .top").html(`
                      ${this.data.characterName} <br>
                      ${this.data.class} - ${this.data.spec} <br>
                      Encounter: ${this.data.encounterName} <br>
                      ${new Date(this.data.startTime).toDateString()} <br>

                        <select class="encounterSelection" id="` + this.base64user + `-selection" name="state">

                        </select>
                    `)

                    var render = {

                    }

                    this.characterData.map((obj, index) => {
                        var date = new Date(obj.startTime).toLocaleString('default', { year: 'numeric', month: 'long', day: 'numeric' });
                        if (!(date in render))
                            render[date] = [];

                        render[date].push({ id: index, text: obj.encounterName + (obj.nope ? " (No Data) " : ""), disabled: obj.nope ? true : false });
                    })

                    var s2 = $('#' + this.base64user + '-selection').select2({
                        data: Object.entries(render).map(group => {
                            return {
                                "text": group[0],
                                "children": group[1],
                                "timestamp": new Date(group[0]).getTime() / 1000
                            }
                        })
                    }).val(id ? id : 0).trigger('change').on("select2:select", e => {
                        this.unbind.forEach(fc => {
                            fc();
                        });
                        this.init(e.params.data.id)
                    });
                }

                json.forEach(item => {
                    this.itemData[item.id] = item;
                });

                var ISM = new ItemSetManager();

                await asyncForEach(this.data.gear, async item => {
                    if (item.id == "0")
                        return false;

                    var slot = this.getItemSlot(this.itemData[item.id].slot)

                    ISM.addItem(this.itemData[item.id].itemset, this.itemData[item.id].id)

                    if (slot == "Trinket" || slot == "Finger") {
                        slot = slot + (slot.includes("Trinket") ? trinketOffset : fingerOffset);
                        slot.includes("Trinket") ? trinketOffset++ : fingerOffset++;
                    }

                    if (slot == "WeaponLeft" && !weaponRight) {
                        weaponRight = true;
                    } else if (slot == "WeaponLeft" && weaponRight) {
                        slot = "WeaponRight";
                    }

                    var color = "white";

                    switch (item.quality) {
                        case "poor":
                            color = "rgb(157,157,157)"
                            break;
                        case "common":
                            color = "rgb(255,255,255)"
                            break;
                        case "uncommon":
                            color = "rgb(30,255,0)"
                            break;
                        case "rare":
                            color = "rgb(0,112,221)"
                            break;
                        case "epic":
                            color = "rgb(163,53,238)"
                            break;
                        case "legendary":
                            color = "rgb(255,128,0)"
                            break;

                    }
                    if (this.template == "table") {
                        $("#" + this.base64user + " .display-item-title").html(this.data.characterName)
                        $("#" + this.base64user + " ." + slot).html(item.name)
                        $("#" + this.base64user + " ." + slot).css("color", color)
                        $("#" + this.base64user + " ." + slot).attr("itemId", item.id)
                    } else {
                        $("#" + this.base64user + " ." + slot).find("img:first")[0].src = "https://render-classic-us.worldofwarcraft.com/icons/56/" + item.icon;
                        $("#" + this.base64user + " ." + slot).attr("itemId", item.id)
                    }
                })

            }


            async getCharacterData() {
                const response = await fetch('character/' + this.user);
                const json = await response.json();
                this.characterData = json.map(encounter => {
                    var filter = encounter.gear.filter(piece => {
                        if (piece.name == "Unknown Item")
                            return true;
                        return false;
                    })

                    if (filter.length > 5) {
                        encounter.nope = true;
                    }

                    return encounter;

                }).sort(function compare(a, b) {
                    if (a.startTime > b.startTime) {
                        return -1;
                    }
                    if (a.startTime < b.startTime) {
                        return 1;
                    }
                    return 0;
                });
                return json;
            }

            recentEncounter() {
                var data = this.characterData;

                if (data.error)
                    return false;

                var mostRecentEncounter = {
                    startTime: 0
                }

                data.map((obj) => {
                    if (obj.gear[0].id != null) {
                        if (obj.startTime > mostRecentEncounter.startTime) {
                            mostRecentEncounter = obj;
                        }
                    }
                });

                return mostRecentEncounter;
            }

            getOutput() {
                return this.template == "table" ? tableTemplate(this.base64user) : armoryTemplate(this.base64user);
            }

            getItemSlot(slot) {
                return slot in this.itemSlots ? this.itemSlots[slot] : false;
            }

        }

        class ItemSetManager {
            constructor() {
                this.itemSets = {};

                this.addItem = this.addItem.bind(this);
                this.returnItemSets = this.returnItemSets.bind(this);
            }

            addItem(itemSetID, item) {
                if (itemSetID == 0)
                    return false;

                if (!(itemSetID in this.itemSets))
                    this.itemSets[itemSetID] = new ItemSet(itemSetID)

                this.itemSets[itemSetID].addItem(item)
            }

            returnItemSets() {
                var returnStructure = {};

                (Object.values(this.itemSets).forEach(element => {
                    element.items.forEach(item => {
                        returnStructure[item] = element.getSetBonus();
                    });
                }));

                return returnStructure;
            }
        }

        class ItemSet {
            constructor(id) {
                this.id = id;
                this.items = [];

                this.addItem = this.addItem.bind(this);
                this.getSetBonus = this.getSetBonus.bind(this);
            }

            addItem(item) {
                if (!this.items.includes(item))
                    this.items.push(item)
            }

            getSetBonus() {
                return this.items.length;
            }
        }


        (async() => {

            var path = window.location.pathname;

            path = path.split("/");
            path.splice(0, 1)

            if (path.length != 2)
                return false;

            var user = path[1].split(",");
            var template = path[0];

            for (var i in user) {
                var userArmory = new Armory(user[i], template);
                $("#players").append(userArmory.getOutput());
            }

            function generateOtherUrl() {
                var path = window.location.pathname;
                if (path.includes("/armory"))
                    path = path.replace("/armory/", "/table/")
                else if (path.includes("/table/"))
                    path = path.replace("/table/", "/armory/")
                return path;
            }

            $("#switch").attr("href", generateOtherUrl())
            return false;
        })();