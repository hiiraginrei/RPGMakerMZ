/*:
 * @target MZ
 * @plugindesc メッセージウィンドウが閉じる時に音を鳴らす
 * @author 氷柊樹
 * @url https://github.com/hiiraginrei/RPGMakerMZ/tree/master/plugin
 *
 * @param soundName
 * @type file
 * @dir audio/se
 * @text SE名
 * @desc 音を鳴らしたいSEのファイル名を指定して下さい。
 * @default Cursor3
 *
 * @param soundVolume
 * @type number
 * @min 0
 * @max 100
 * @text 音量（数値）
 * @desc SEの音量。
 * 0～100の間で設定して下さい。
 * @default 90
 *
 * @param soundPitch
 * @type number
 * @min 50
 * @max 150
 * @text ピッチ（数値）
 * @desc SEのピッチ。
 * 50～150の間で設定して下さい。
 * @default 100
 *
 * @param soundPan
 * @type number
 * @min -100
 * @max 100
 * @text 位相（数値）
 * @desc SEの位相。
 * -100～100の間で設定して下さい。
 * @default 0
 *
 * @param onlyMessageWindow
 * @type boolean
 * @text 別ウィンドウのクローズ制御
 * @desc 選択肢、数値入力、アイテム入力のウィンドウクローズ時は音を出さない。
 * @default	true
 * 
 * @command CallCloseEvent
 * @text クローズ音の出すタイミングを任意で設定
 * @desc クローズ音の出すタイミングを任意で設定します。
 * 
 * @arg closeSoundON
 * @type boolean
 * @text クローズ音
 * @desc trueにすれば音を出す。falseにすれば出さない。
 * @default	true
 *
 * @help
 * メッセージウィンドウがクローズする時に音を鳴らします。
 * それぞれ下記の通り設定して下さい。
 *
 * SE名：音を鳴らしたいSEのファイル名を指定
 * 音量（数値）：SEの音量を0～100の間で設定
 * ピッチ（数値）：SEのピッチを50～150の間で設定
 * 位相（数値）：SEの位相を-100～100の間で設定
 *
 * SE名のデフォルトはCursor3.oggです。
 *
 * プラグインコマンドでクローズ音のON、OFFを制御することもできます。
 * シーンによって音を出す、出さないを切り分ける時に使えます。
 *
 * 【ライセンス】
 * このプラグインはMITライセンスに基づいて配布されています。
 * http://opensource.org/licenses/mit-license.php
*/
(() => {
	const PLUGIN_NAME = 'WindowMessageCloseSound';
	const params = PluginManager.parameters(PLUGIN_NAME);
	const soundName = params["soundName"] || "Cursor3";
	const soundVolume = Number(params['soundVolume'] || 90);
	const soundPitch = Number(params['soundPitch'] || 100);
	const soundPan = Number(params['soundPan'] || 0);
	const onlyMessageWindow = params["onlyMessageWindow"] === "true" ? true : false;
	let closeSoundFlg = true;

	const _Window_ChoiceList_prototype_start = Window_ChoiceList.prototype.start;
	Window_ChoiceList.prototype.start = function() {
		_Window_ChoiceList_prototype_start.call(this);
		this._noSound = onlyMessageWindow;
	};

	const _Window_EventItem_prototype_start = Window_EventItem.prototype.start;
	Window_EventItem.prototype.start = function() {
		_Window_EventItem_prototype_start.call(this);
		this._noSound = onlyMessageWindow;
	};

	const _Window_NumberInput_prototype_start = Window_NumberInput.prototype.start;
	Window_NumberInput.prototype.start = function() {
		_Window_NumberInput_prototype_start.call(this);
		this._noSound = onlyMessageWindow;
	};

	const _Window_Message_prototype_terminateMessage = Window_Message.prototype.terminateMessage;
	Window_Message.prototype.terminateMessage = function() {
		_Window_Message_prototype_terminateMessage.call(this);
		let choiceNoSoundFlg = this._choiceListWindow._noSound;
		let numberNoSoundFlg = this._numberInputWindow._noSound;
		let eventNoSoundFlg = this._eventItemWindow._noSound;
		if (!choiceNoSoundFlg && !numberNoSoundFlg && !eventNoSoundFlg && closeSoundFlg) {
			let se = {
				name: soundName,
				pan: soundPan,
				pitch: soundPitch,
				volume: soundVolume,
			}
			AudioManager.playSe(se);
		} else {
			this._choiceListWindow._noSound = false;
			this._numberInputWindow._noSound = false;
			this._eventItemWindow._noSound = false;
		}
	};

	PluginManager.registerCommand(PLUGIN_NAME, "CallCloseEvent", function(args) {
		closeSoundFlg = eval(getCommandValue(args.closeSoundON));
	});

	function getCommandValue(value) {
		if (value === undefined) {
			return value;
		}

		return value.split("#")[0].trim();
	}
})();