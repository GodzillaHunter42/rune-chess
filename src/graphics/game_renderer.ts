import BoardPosition from "../engine/board_position";
import Globals from "../engine/constants";
import RuneChess from "../engine/game";
import { TeamColor } from "../engine/team";
import Unit from "../engine/unit/unit";
import UnitType from "../engine/unit/unit_type";
import DataDragon from "../riot/data_dragon";
import { AssetManager, ImageAsset } from "./asset_manager";
import baseAssetManager from "./base_asset_manager";
import { Display, TextStyle } from "./display";
import Vector2 from "./vector2";
import fs from "fs";

const CONFIG_PATH = "gfx_config.json";

interface GraphicsConfig {
    imageSize: number;
    font: string | null;
}

interface BoardMetrics {
    center: number;
    cellSize: number;
    padding: number;
}

export class GameRenderer {
    display: Display;
    assetManager: AssetManager;
    ready: boolean;
    dataDragon: DataDragon;
    config: GraphicsConfig;
    metrics: BoardMetrics;

    constructor() {
        this.assetManager = baseAssetManager();
        this.ready = false;
        this.dataDragon = new DataDragon();

        this.config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
        console.log(`[GameRenderer] Config loaded from ${CONFIG_PATH}`);

        this.display = Display.create(this.config.imageSize, this.config.imageSize);
        let imageSize = this.config.imageSize;
        this.metrics = {
            center: imageSize / 2,
            cellSize: imageSize * 0.082,
            padding: 0,
        };

        this.metrics.padding = this.metrics.center - this.metrics.cellSize * 4;

        if (this.config.font) this.display.setDefaultFont(this.config.font);
    }

    boardPosToScreenPos(pos: BoardPosition) {
        return Vector2.from(
            pos.x * this.metrics.cellSize + this.metrics.padding,
            pos.y * this.metrics.cellSize + this.metrics.padding
        );
    }

    drawUnitIcon(unit: Unit) {
        let pos = this.boardPosToScreenPos(unit.pos);
        let unitIconAsset: ImageAsset;

        if (unit.unitType === UnitType.Champion) {
            unitIconAsset = this.iconAssetForChampion(unit.name);
        } else if (unit.unitType === UnitType.Minion) {
            if (unit.teamColor === TeamColor.Red) {
                unitIconAsset = this.assetManager.getAsset("minion.red");
            } else {
                unitIconAsset = this.assetManager.getAsset("minion.blue");
            }
        } else {
            throw new Error("Cannot draw unit of unknown type");
        }
        this.display.clipped(
            () => {
                this.display.context.beginPath();
                this.display.circlePath(
                    pos.plus(Vector2.pair(this.metrics.cellSize / 2)),
                    this.metrics.cellSize / 2 - 5
                );
            },
            () => {
                this.display.context.fillStyle = "red";
                //this.display.context.fillRect(pos.x, pos.y, cellSize, cellSize);
                this.display.context.drawImage(
                    unitIconAsset.image,
                    pos.x,
                    pos.y,
                    this.metrics.cellSize,
                    this.metrics.cellSize
                );
            }
        );
        let teamColor = { [TeamColor.Blue]: "blue", [TeamColor.Red]: "red", [TeamColor.Neutral]: "white" }[
            unit.teamColor
        ];
        this.display.draw(
            () => {
                //console.log(TeamColor[unit.teamColor], JSON.stringify(unit.pos))
                this.display.circlePath(
                    pos.plus(Vector2.pair(this.metrics.cellSize / 2)),
                    this.metrics.cellSize / 2 - 5
                );
            },
            { stroke: teamColor, lineWidth: 1 }
        );
    }

    render(game: RuneChess) {
        this.ensureLoaded();
        this.display.clear();

        let board = this.assetManager.getAsset("game.board");
        let image = board.image!;
        this.display.context.drawImage(image, 0, 0, this.display.width, this.display.height);

        // draw grid lines

        let gridRuleStyle: TextStyle = {
            size: this.metrics.cellSize * 0.6,
            fill: "white",
        };

        for (let x = 0; x < Globals.boardSize + 1; x++) {
            let dx = x * this.metrics.cellSize + this.metrics.padding;

            this.display.drawLine(
                Vector2.from(dx, this.metrics.padding),
                Vector2.from(dx, this.config.imageSize - this.metrics.padding),
                "white"
            );

            if (x === Globals.boardSize) {
                break;
            }

            this.display.drawText(
                "ABCDEFGHIJKLM"[x],
                new Vector2(dx + this.metrics.cellSize / 2, this.metrics.padding - this.metrics.cellSize),
                {
                    ...gridRuleStyle,
                    baseline: "top",
                    align: "center",
                }
            );
        }

        for (let y = 0; y < Globals.boardSize + 1; y++) {
            let dy = y * this.metrics.cellSize + this.metrics.padding;
            this.display.drawLine(
                Vector2.from(this.metrics.padding, dy),
                Vector2.from(this.config.imageSize - this.metrics.padding, dy),
                "white"
            );

            if (y === Globals.boardSize) {
                break;
            }

            this.display.drawText(
                (y + 1).toString(),
                new Vector2(this.metrics.padding - this.metrics.cellSize, dy + this.metrics.cellSize / 2),
                {
                    ...gridRuleStyle,
                    baseline: "middle",
                    align: "left",
                }
            );
        }

        // draw units

        for (let unit of game.board.allUnits()) {
            //console.log("Drawing unit",unit.name,TeamColor[unit.teamColor],unit.pos)
            this.drawUnitIcon(unit);
        }

        //console.log(game.board.allUnits());
    }

    getCanvasBuffer() {
        return this.display.getCanvasInstance().toBuffer("image/png");
    }

    ensureLoaded() {
        if (!this.ready) {
            throw new Error("Cannot render before initialization");
        }
    }

    iconAssetForChampion(name: string) {
        this.ensureLoaded();
        return this.assetManager.getAsset(`champion.${name}.icon`);
    }

    async init() {
        await this.dataDragon.useLatestGameVersion();
        // load Riot assets
        for (let name of Globals.championRegistry.allChampionNames()) {
            let squareURL = this.dataDragon.championSquareLink(name);

            this.assetManager.register(`champion.${name}.icon`, squareURL);
        }

        await this.assetManager.loadAll();
        this.ready = true;
        console.log("[GameRenderer] Initialized successfully");
    }
}
