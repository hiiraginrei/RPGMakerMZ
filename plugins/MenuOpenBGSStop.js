/*:
 * @target MZ
 * @plugindesc メニューが開いている間はBGSを停止
 * @author 氷柊樹
 * @url https://github.com/hiiraginrei/RPGMakerMZ/tree/master/plugins
 *
 * @help
 * メニューを開いている間、BGSの演奏を停止します。
 * 
 * プラグインコマンドはありません。
 *
 * 【ライセンス】
 * このプラグインはMITライセンスに基づいて配布されています。
 * http://opensource.org/licenses/mit-license.php
*/
(() => {
	const _Scene_MenuBase_create = Scene_MenuBase.prototype.create;
	Scene_MenuBase.prototype.create = function() {
		_Scene_MenuBase_create.call(this);
		if (SceneManager._previousClass === Scene_Map) {
			$gameSystem._menuBgsCache = AudioManager.saveBgs();
			AudioManager.stopBgs();
		}
	};

	const _Scene_MenuBase_terminate = Scene_MenuBase.prototype.terminate;
	Scene_MenuBase.prototype.terminate = function() {
		_Scene_MenuBase_terminate.call(this);
		if (SceneManager._nextScene instanceof Scene_Map) {
			if ($gameSystem._menuBgsCache) {
				AudioManager.replayBgs($gameSystem._menuBgsCache);
				$gameSystem._menuBgsCache = null;
			}
		}
	};

	const _Game_System_onBeforeSave = Game_System.prototype.onBeforeSave;
	Game_System.prototype.onBeforeSave = function() {
		_Game_System_onBeforeSave.call(this);
		if (this._menuBgsCache) {
			this._bgsOnSave = this._menuBgsCache;
		}
	};

	const _Scene_Map_start = Scene_Map.prototype.start;
	Scene_Map.prototype.start = function() {
		_Scene_Map_start.call(this);
		$gameSystem._menuBgsCache = null;
	};
})();