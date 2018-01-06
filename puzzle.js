/*jshint esversion:6, unused:true, undef:true */

"use strict";

// main

function main()
{
    const x = 4, y = 4, pix = 25;

    let display = new Display
    (
        new Coords(x*pix, y*pix),   // canvasSizeInPixels
        new Coords(pix, pix),       // cellSizeInPixels
        10,                         // fontHeightInPixels
        "White",                    // colorBack
        "Gray"                      // colorFore
    );

    let grid = new Grid
    (
        new Coords(x, y)
    ).randomize();
    grid.cursorPos = grid.openCellPos();

    Globals.Instance.initialize
    (
        display, grid
    );
}

// classes

function Coords(x=0, y=0)
{
    this.x = x;
    this.y = y;
}
{
    Coords.prototype.add = function(other)
    {
        this.x += other.x;
        this.y += other.y;
        return this;
    };

    Coords.prototype.divide = function(other)
    {
        this.x /= other.x;
        this.y /= other.y;
        return this;
    };

    Coords.prototype.divideScalar = function(scalar)
    {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    };

    Coords.prototype.clone = function()
    {
        return new Coords(this.x, this.y);
    };

    Coords.prototype.multiply = function(other)
    {
        this.x *= other.x;
        this.y *= other.y;
        return this;
    };

    Coords.prototype.magnitude = function()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };

    Coords.prototype.overwriteWith = function(other)
    {
        this.x = other.x;
        this.y = other.y;
        return this;
    };

    Coords.prototype.subtract = function(other)
    {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    };

    Coords.prototype.trimToRangeMax = function(max)
    {
        if (this.x < 0)
        {
            this.x = 0;
        }
        else if (this.x > max.x)
        {
            this.x = max.x;
        }

        if (this.y < 0)
        {
            this.y = 0;
        }
        else if (this.y > max.y)
        {
            this.y = max.y;
        }

        return this;
    };
}

function Display(canvasSizeInPixels, cellSizeInPixels, fontHeightInPixels, colorBack, colorFore)
{
    this.canvasSizeInPixels = canvasSizeInPixels;
    this.cellSizeInPixels = cellSizeInPixels;
    this.fontHeightInPixels = fontHeightInPixels;
    this.colorBack = colorBack;
    this.colorFore = colorFore;
}
{
    Display.prototype.initialize = function()
    {
        let canvas = document.createElement("canvas");
        canvas.width = this.canvasSizeInPixels.x;
        canvas.height = this.canvasSizeInPixels.y;

        this.graphics = canvas.getContext("2d");
        this.graphics.font = this.fontHeightInPixels + "px sans-serif";

        document.body.appendChild(canvas);
    };

    // drawing

    Display.prototype.clear = function()
    {
        this.drawRectangle
        (
            new Coords(0, 0),
            this.canvasSizeInPixels,
            this.colorBack,
            this.colorFore
        );
    };

    Display.prototype.drawRectangle = function(pos, size, colorFill, colorBorder)
    {
        if (colorFill !== null)
        {
            this.graphics.fillStyle = colorFill;
            this.graphics.fillRect
            (
                pos.x, pos.y,
                size.x, size.y
            );
        }

        if (colorBorder !== null)
        {
            this.graphics.strokeStyle = colorBorder;
            this.graphics.strokeRect
            (
                pos.x, pos.y,
                size.x, size.y
            );
        }
    };

    Display.prototype.drawText = function(text, pos, color)
    {
        this.graphics.fillStyle = color;
        this.graphics.textAlign = 'center';
        this.graphics.fillText
        (
            text,
            pos.x, pos.y + this.fontHeightInPixels
        );
    };

}

function Globals()
{
    // do nothing
}
{
    Globals.Instance = new Globals();

    Globals.prototype.initialize = function(display, grid)
    {
        this.display = display;
        this.grid = grid;

        this.display.initialize();
        this.grid.drawToDisplay(this.display);

        this.inputHelper = new InputHelper();
        this.inputHelper.initialize();
    };
}

function Grid(sizeInCells)
{
    this.sizeInCells = sizeInCells;

    this.cells = new Array(sizeInCells.x * sizeInCells.y);
    for (let i = 0; i < this.cells.length; i++)
        this.cells[i] = i;

    this.cursorPos = new Coords(0, 0);
}
{
    Grid.prototype.cellAtPosGet = function(cellPos)
    {
        let cellIndex = this.indexOfCellAtPos(cellPos);
        let cellValue = this.cells[cellIndex];
        return cellValue;
    };

    Grid.prototype.cellAtPosSet = function(cellPos, valueToSet)
    {
        let cellIndex = this.indexOfCellAtPos(cellPos);
        this.cells[cellIndex] = valueToSet;
    };

    Grid.prototype.cursorMove = function(direction)
    {
        this.cursorPos.add
        (
            direction
        ).trimToRangeMax
        (
            this.sizeInCells.clone().subtract(new Coords(1,1))
        );
    };

    Grid.prototype.indexOfCellAtPos = function(cellPos)
    {
        return cellPos.y * this.sizeInCells.x + cellPos.x;
    };

    Grid.prototype.openCellPos = function()
    {
        const idx = this.cells.indexOf(0);
        let cellPos = new Coords(
            Math.floor(idx % this.sizeInCells.x),
            Math.floor(idx / this.sizeInCells.x)
        );
        return cellPos;
    };

    Grid.prototype.randomize = function()
    {
        this.cells.sort((a,b) => Math.random() >= 0.5 ? -1 : 1);
        return this;
    };

    Grid.prototype.slideAtCursorIfPossible = function()
    {
        let openCellPos = this.openCellPos();
        let displacement = openCellPos.clone().subtract
        (
            this.cursorPos
        );
        let distance = displacement.magnitude();
        if (distance == 1)
        {
            let cellValueToSlide = this.cellAtPosGet(this.cursorPos);
            this.cellAtPosSet(this.cursorPos, 0);
            this.cellAtPosSet(openCellPos, cellValueToSlide);
        }
    };

    // drawable

    Grid.prototype.drawToDisplay = function(display)
    {
        let cellSizeInPixelsHalf =
            display.cellSizeInPixels.clone().divideScalar(2);

        let cellPos = new Coords();
        let drawPos = new Coords();
        let cellValue;

        for (let y = 0; y < this.sizeInCells.y; y++)
        {
            cellPos.y = y;

            for (let x = 0; x < this.sizeInCells.x; x++)
            {
                cellPos.x = x;

                cellValue = this.cellAtPosGet(cellPos);

                drawPos.overwriteWith
                (
                    cellPos
                ).multiply
                (
                    display.cellSizeInPixels
                );

                display.drawRectangle
                (
                    drawPos,
                    display.cellSizeInPixels,
                    display.colorBack, // fill
                    display.colorFore // border
                );

                drawPos.add
                (
                    cellSizeInPixelsHalf
                );

                if ( cellValue ) display.drawText
                (
                    String(cellValue),
                    drawPos,
                    display.colorFore
                );
            }
        }

        drawPos.overwriteWith
        (
            this.cursorPos
        ).multiply
        (
            display.cellSizeInPixels
        );

        display.drawRectangle
        (
            drawPos,
            display.cellSizeInPixels,
            display.colorFore, // fill
            display.colorBack // border
        );

        drawPos.add
        (
            cellSizeInPixelsHalf
        );

        cellValue = this.cellAtPosGet(this.cursorPos);

        if ( cellValue ) display.drawText
        (
            String(cellValue),
            drawPos,
            display.colorBack
        );
    };
}

function InputHelper()
{
    // do nothing
}
{
    InputHelper.prototype.initialize = function()
    {
        this.inputMap = new Map();
        this.inputMap.set("ArrowDown", new Coords(0,1));
        this.inputMap.set("ArrowLeft", new Coords(-1,0));
        this.inputMap.set("ArrowRight", new Coords(1,0));
        this.inputMap.set("ArrowUp", new Coords(0,-1)); 
        
        // canvas gets mouse events, but document.body will do for now
        document.body.onclick = this.handleEventMouseClick.bind(this);
        // canvas doesn't seem to get keydown events
        document.body.onkeydown = this.handleEventKeyDown.bind(this);
    };

    // events

    InputHelper.prototype.handleEventKeyDown = function(event)
    {
        let grid = Globals.Instance.grid;
        let c = this.inputMap.get(event.key);

        if ( c )
        {
            grid.cursorMove(c);
        }
        else if (event.key == "Enter" || event.key == " ")
        {
            grid.slideAtCursorIfPossible();
        }

        grid.drawToDisplay(Globals.Instance.display);
    };

    InputHelper.prototype.handleEventMouseClick = function(event)
    {
        let grid = Globals.Instance.grid;
        let display = Globals.Instance.display;

        grid.cursorPos = new Coords(Math.floor(event.offsetX / display.cellSizeInPixels.x), Math.floor(event.offsetY / display.cellSizeInPixels.y));
        grid.slideAtCursorIfPossible();
        grid.drawToDisplay(display);
    };
}

// run

main();
