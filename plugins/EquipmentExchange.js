/*:
 * @target MZ
 * @plugindesc パーティ間で仲間の装備を交換する
 * @author 氷柊樹
 *
 * @param exchangeWindowFlg
 * @type boolean
 * @text 装備交換時の確認ウィンドウ
 * @desc 装備交換時に確認ウィンドウを表示させるかどうか。
 * @default	true
 *
 * @param exchangeWindowWidth
 * @type number
 * @text 確認ウィンドウの横幅
 * @desc 確認ウィンドウの横幅を指定。
 * @default	400
 *
 * @param exchangePrefix
 * @type string
 * @text 別アクター装備中の接頭辞
 * @desc 装備中の仲間名の前に付く区別文字
 * 【例】E:にした場合の表記 → E:リード
 * @default	E:
 *
 * @param exchangeMessageText
 * @type multiline_string
 * @text 装備交換時の確認メッセージ
 * @desc 他の仲間と装備を交換する時の確認メッセージ。
 * @default が装備中です
 * 交換しますか？
 *
 * @param exchangeMessageLines
 * @type number
 * @text 確認メッセージの行数
 * @desc 確認メッセージを表示する場合の行数指定。
 * 確認メッセージの行数に合わせて調整して下さい。
 * @default	2
 *
 * @param exchangeConfirmWidth
 * @type number
 * @text 選択肢ウィンドウの横幅
 * @desc 選択肢ウィンドウの横幅を指定。
 * @default	240
 *
 * @param exchangeConfirmYes
 * @type string
 * @text 選択肢の文字（OK時）
 * @desc 選択肢でOKの場合の文字表記。
 * @default	はい
 *
 * @param exchangeConfirmNo
 * @type string
 * @text 選択肢の文字（キャンセル時）
 * @desc 選択肢でキャンセルの場合の文字表記。
 * @default	いいえ
 *
 * @help
 * パーティ間で装備交換ができるようになります。
 * 例えばリードが交換可能な装備品を装備していたら、
 * リストに「装備名 (E:リード)」と表示されます。
 * ※「E:」の表記は変更可能
 *
 * パーティに参加していないアクター、
 * 及び固定にしているアクターの装備はリストに表示されません。
 *
 * 交換希望の相手が装備できない装備品と交換した場合、
 * 相手の装備スロットは空（装備なしの状態）になります。
 * ※装備できなかった装備品は所持品として手元に残ります
 *
 * 別アクターの装備は、同じ装備スロットIDを参照しています。
 * そのため二刀流にしている時は同スロットの武器しか交換できません。
 * また、アクターごとに異なる装備スロットを設定するプラグインを
 * 別で入れていると、うまく動作しない可能性があります。
 *
 * 【ライセンス】
 * このプラグインはMITライセンスに基づいて配布されています。
 * http://opensource.org/licenses/mit-license.php
*/
(() => {
    const PLUGIN_NAME = 'EquipmentExchange';
    const params = PluginManager.parameters(PLUGIN_NAME);
    const exchangeWindowFlg = params["exchangeWindowFlg"] === "true";
    const exchangeWindowWidth = params.exchangeWindowWidth || 400;
    const exchangePrefix = params.exchangePrefix || "E:";
    const exchangeMessageText = params.exchangeMessageText || "が装備中です\n交換しますか？";
    const exchangeMessageLines = params.exchangeMessageLines || 2;
    const exchangeConfirmWidth = params.exchangeConfirmWidth || 240;
    const exchangeConfirmYes = params.exchangeConfirmYes || "はい";
    const exchangeConfirmNo = params.exchangeConfirmNo || "いいえ";

    //-----------------------------------------------------------------------------
    // ExchangeEquip オブジェクトの定義
    //-----------------------------------------------------------------------------

    function ExchangeEquip(item, actorId, slotId) {
        this.item = item;          
        this.actorId = actorId;    
        this.slotId = slotId;      
        this.isExchangeEquip = true;

        if (item) {
            this.wtypeId = item.wtypeId || 0;
            this.atypeId = item.atypeId || 0;
            this.id = item.id || 0;
            this.iconIndex = item.iconIndex;
            this.etypeId = item.etypeId;
            this.meta = item.meta;
        } else {
            this.wtypeId = 0;
            this.atypeId = 0;
            this.id = 0;
            this.iconIndex = 0;
            this.etypeId = 0;
            this.meta = {};
        }
    }

    Object.defineProperty(ExchangeEquip.prototype, 'name', {
        get: function() { 
            const targetActor = $gameActors.actor(this.actorId);
            const targetName = targetActor ? targetActor.name() : "???";
            const itemName = this.item ? this.item.name : 'なし';
            return `${itemName} (${exchangePrefix}${targetName})`;
        }
    });
    Object.defineProperty(ExchangeEquip.prototype, 'description', {
        get: function function1() { 
            return this.item ? this.item.description : "";
        }
    });

    //-----------------------------------------------------------------------------
    // Window_EquipItem
    //-----------------------------------------------------------------------------

    const _Window_EquipItem_makeItemList = Window_EquipItem.prototype.makeItemList;
    Window_EquipItem.prototype.makeItemList = function() {
        _Window_EquipItem_makeItemList.call(this);

        this._data = [];
        const currentActor = this._actor;
        const slotId = this._slotId;
        const exchangeItems = [];

        for (const targetActor of $gameParty.members()) {
            if (targetActor.actorId() === currentActor.actorId()) continue;
            const targetEquip = targetActor.equips()[slotId];
            if (targetEquip) {
                if (this.includes(targetEquip) && !targetActor.isEquipTypeLocked(targetEquip.etypeId)) {
                    const exchangeItem = new ExchangeEquip(targetEquip, targetActor.actorId(), slotId);
                    exchangeItems.push(exchangeItem);
                }
            }
        }

        const partyItems = $gameParty.equipItems().filter(item => {
            return this.includes(item);
        });

        this._data.push(...exchangeItems);
        this._data.push(...partyItems);
        if (this.includes(null)) {
            this._data.push(null);
        }
    };

    const _Window_EquipItem_drawItem = Window_EquipItem.prototype.drawItem;
    Window_EquipItem.prototype.drawItem = function(index) {
        const item = this.itemAt(index);

        if (item && item.isExchangeEquip) {
            const originalDbItem = item.item;

            if (originalDbItem) {
                const rect = this.itemLineRect(index);
                const iconBoxWidth = ImageManager.iconWidth + 4;
                const textX = rect.x + iconBoxWidth;
                const name = item.name;

                this.contents.clearRect(rect.x, rect.y, rect.width, rect.height);
                this.drawIcon(originalDbItem.iconIndex, rect.x, rect.y + 2);
                this.drawText(name, textX, rect.y, rect.width - iconBoxWidth);
            }
        } else {
            _Window_EquipItem_drawItem.call(this, index);
        }
    };

    const _Window_EquipItem_drawItemNumber = Window_EquipItem.prototype.drawItemNumber;
    Window_EquipItem.prototype.drawItemNumber = function(item, x, y, width) {
        if (item && item.isExchangeEquip) {
            return;
        }
        _Window_EquipItem_drawItemNumber.call(this, item, x, y, width);
    };

    const _Window_EquipItem_updateHelp = Window_EquipItem.prototype.updateHelp;
    Window_EquipItem.prototype.updateHelp = function() {
        _Window_EquipItem_updateHelp.call(this);

        Window_ItemList.prototype.updateHelp.call(this);
        if (this._actor && this._statusWindow && this._slotId >= 0) {
            const actor = JsonEx.makeDeepCopy(this._actor);
            const isCustomItem = this.item() && this.item().isExchangeEquip && this.item() instanceof ExchangeEquip;
            const item = isCustomItem ? this.item().item : this.item();

            actor.forceChangeEquip(this._slotId, item);
            this._statusWindow.setTempActor(actor);
        }
    };

    //-----------------------------------------------------------------------------
    // Scene_Equip
    //-----------------------------------------------------------------------------

    const _Scene_Equip_create = Scene_Equip.prototype.create;
    Scene_Equip.prototype.create = function() {
        _Scene_Equip_create.call(this);

        this._exchangeItem = null;

        this.createExchangeConfirmWindow();
    };

    Scene_Equip.prototype.createExchangeConfirmWindow = function() {
        const rect = new Rectangle(0, 0, exchangeWindowWidth, this.calcWindowHeight(exchangeMessageLines, false));
        const padding = $gameSystem.windowPadding() * 2;
        this.createExchangeMsgWindow(rect, padding);
        this.createExchangeCmdWindow(rect, padding);
    };

    Scene_Equip.prototype.createExchangeMsgWindow = function(rect, padding) {
        this._exchangeMsgWindow = new Window_Base(rect);
        this._exchangeMsgWindow.x = Graphics.boxWidth / 2 - exchangeWindowWidth / 2;
        this._exchangeMsgWindow.y = (Graphics.boxHeight / 2 - (rect.height + this.calcWindowHeight(2, true)) / 2) - padding;
        this._exchangeMsgWindow.height = rect.height + padding;
        this._exchangeMsgWindow.padding = padding;
        this._exchangeMsgWindow.hide();
        this.addWindow(this._exchangeMsgWindow);
    };

    Scene_Equip.prototype.createExchangeCmdWindow = function(rect, padding) {
        const cmdRect = new Rectangle(0, 0, exchangeConfirmWidth, this.calcWindowHeight(2, true));
        this._exchangeCmdWindow = new Window_Command(cmdRect);
        this._exchangeCmdWindow.x = Graphics.boxWidth / 2 - exchangeConfirmWidth / 2;
        this._exchangeCmdWindow.y = this._exchangeMsgWindow.y + rect.height + padding;

        this._exchangeCmdWindow.makeCommandList = function() {
            this.addCommand(exchangeConfirmYes, 'yes');
            this.addCommand(exchangeConfirmNo, 'no');
        };

        this._exchangeCmdWindow.setHandler('yes', this.onConfirmOk.bind(this));
        this._exchangeCmdWindow.setHandler('no', this.onConfirmCancel.bind(this));
        this._exchangeCmdWindow.setHandler('cancel', this.onConfirmCancel.bind(this));
        this._exchangeCmdWindow.refresh();
        this._exchangeCmdWindow.hide();
        this._exchangeCmdWindow.deactivate();

        this.addWindow(this._exchangeCmdWindow);
    };

    const _Scene_Equip_onItemOk = Scene_Equip.prototype.onItemOk;
    Scene_Equip.prototype.onItemOk = function() {
        const item = this._itemWindow.item();
        const isCustomItem = item && item.isExchangeEquip && item instanceof ExchangeEquip;

        if (isCustomItem) {
            this._exchangeItem = item;
            this._itemWindow.deactivate();

            if (exchangeWindowFlg) {
                this.executeExchangeConfirm(item);
            } else {
                this.executeExchange(item);
            }
        } else {
            _Scene_Equip_onItemOk.call(this);
        }
    };

    Scene_Equip.prototype.executeExchangeConfirm = function(exchangeItem) {
        const targetActor = $gameActors.actor(exchangeItem.actorId);
        const text = `\\c[2]${targetActor.name()}\\c[0]${exchangeMessageText}`;
        const padding = this._exchangeMsgWindow.padding;
        const width = this._exchangeMsgWindow.width - padding * 2;

        this._exchangeMsgWindow.contents.clear();
        this._exchangeMsgWindow.drawTextEx(text, 0, 0, width);
        this._exchangeMsgWindow.show();

        this._exchangeCmdWindow.show();
        this._exchangeCmdWindow.activate();
        this._exchangeCmdWindow.select(0);
    };

    Scene_Equip.prototype.onConfirmOk = function() {
        this.executeExchange(this._exchangeItem);
    };

    Scene_Equip.prototype.onConfirmCancel = function() {
        this._exchangeCmdWindow.hide();
        this._exchangeCmdWindow.deactivate();
        this._exchangeMsgWindow.hide();
        this._itemWindow.activate();
    };

    Scene_Equip.prototype.executeExchange = function(exchangeItem) {
        const currentActor = this.actor();
        const targetActor = $gameActors.actor(exchangeItem.actorId);
        const slotId = exchangeItem.slotId;
        const currentEquip = currentActor.equips()[slotId];
        const targetEquip = exchangeItem.item;

        const setEquipObject = (actor, slot, item) => {
            if (!actor._equips[slot]) {
                actor._equips[slot] = new Game_Item();
            }
            actor._equips[slot].setObject(item);
            actor.releaseUnequippableItems(false);
            actor.refresh();
        }

        setEquipObject(currentActor, slotId, targetEquip);
        setEquipObject(targetActor, slotId, currentEquip);

        SoundManager.playEquip();

        this._exchangeCmdWindow.hide();
        this._exchangeMsgWindow.hide();
        this.hideItemWindow();

        this._statusWindow.refresh();
        this._itemWindow.refresh();
        this._slotWindow.refresh();

        this._exchangeItem = null;
    };

    const _Scene_Equip_prototype_arePageButtonsEnabled = Scene_Equip.prototype.arePageButtonsEnabled;
    Scene_Equip.prototype.arePageButtonsEnabled = function() {
        _Scene_Equip_prototype_arePageButtonsEnabled.call(this);
        return !((this._itemWindow && this._itemWindow.active) || (this._exchangeCmdWindow && this._exchangeCmdWindow.visible));
    };

})();