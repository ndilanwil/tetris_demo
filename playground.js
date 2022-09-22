class Board {
    constructor(ctx, ctxNext, ctxHold) {
        this.ctx = ctx;
        this.ctxNext = ctxNext;
        this.ctxHold = ctxHold;
        this.init();
    }

    init() {
        //calculate board size
        this.ctx.canvas.width = COLS * BLOCK_SIZE;
        this.ctx.canvas.height = ROWS * BLOCK_SIZE;
        //draw board
        this.ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    }

    clearHoldBox() {
        const { width, height } = this.ctxHold.canvas;
        this.ctxHold.clearRect(0, 0, width, height);
        this.ctxHold.piece = false;
    }

    reset() {
        this.grid = this.getEmptyGrid();
        this.clearHoldBox();
        this.piece = new Piece(this.ctx);
        this.piece.setStartingPosition();
        this.getNewPiece();
    }

    getNewPiece() {
        const { width, height } = this.ctxNext.canvas;
        this.next = new Piece(this.ctxNext);
        this.ctxNext.clearRect(0, 0, width, height);
        this.next.draw();
    }

    draw() {
        this.piece.draw();
        this.drawBoard();
    }

    drop() {
        let p = moves[KEY.DOWN](this.piece);
        if (this.valid(p)) {
            this.piece.move(p);
        } 
        else {
            this.freeze();
            this.clearLines();
            if(this.piece.y === 0){
                gameover.play();
                return false;
            }
            fall.play();
            this.piece = this.next;
            this.piece.ctx = this.ctx;
            this.piece.setStartingPosition();
            this.getNewPiece();
        }
        return true;
    }

    clearLines(){
        let lines = 0;
        this.grid.forEach((row, y) => {
            if(row.every((value) => value > 0)){
                lines++;
                this.grid.splice(y, 1);
                clear.play();
                this.grid.unshift(Array(COLS).fill(0));
            }
        });
        if(lines > 0){
            account.score += this.getLinesClearedPoints(lines);
            account.lines += lines;
            if(account.lines >= LINES_PER_LEVEL){
                account.level++;
                account.lines -= LINES_PER_LEVEL;
                time.level = LEVEL[account.level];
            }
        }
    }

    valid(p){
        return p.shape.every((row, dy) => {
            return row.every((value, dx) => {
                let x = p.x + dx;
                let y = p.y + dy;
                return value === 0 || (this.isInsideWall(x, y) && this.notOccupied(x, y));
            });
        });
    }

    freeze(){
        this.piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if(value > 0){
                    this.grid[y + this.piece.y][x + this.piece.x] = value;
                }
            });
        });
    }

    drawBoard(){
        this.grid.forEach((row, y) => {
            row.forEach((value, x) => {
                if(value > 0){
                    this.ctx.fillStyle = COLORS[value];
                    this.ctx.fillRect(x, y, 1, 1);
                }
            });
        });
    }

    getEmptyGrid(){
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    isInsideWall(x, y){
        return x >= 0 && x < COLS && y <= ROWS;
    }

    notOccupied(x, y){
        return this.grid[y] && this.grid[y][x] === 0;
    }

    rotate(piece, direction){
        let p = JSON.parse(JSON.stringify(piece));
        if(!piece.hardDropped){
            //transpose matrice
            for(let y = 0; y < p.shape.length; y++){
                for(let x = 0; x < y; x++){
                    [p.shape[x][y], p.shape[y][x]] = [p.shape[y][x], p.shape[x][y]];
                }
            }
            //reverse columns orders
            if(direction === ROTATION.RIGHT){
                p.shape.forEach((row) => row.reverse());
                rotate.play();
            } 
              else if(direction === ROTATION.LEFT){
                p.shape.reverse();
                rotate.play();
            }
        }
        return p;
    }

    swapPieces(){
        if(!this.ctxHold.piece){
            //move current piece to hold and move next piece to current one
            this.ctxHold.piece = this.piece;
            this.piece = this.next;
            this.getNewPiece();
        }
        else{
            //swap current piece with hold
            let temp = this.piece;
            this.piece = this.ctxHold.piece;
            this.ctxHold.piece = temp;
        }
        this.ctxHold.piece.ctx = this.ctxHold;
        this.piece.ctx = this.ctx;
        this.piece.setStartingPosition();
        this.hold=this.ctxHold.piece;
        const { width,height } = this.ctxHold.canvas;
        this.ctxHold.clearRect(0, 0, width, height);
        this.ctxHold.piece.x = 0;
        this.ctxHold.piece.y = 0;
        this.ctxHold.piece.draw();
    }   

    swap(){
        //swap oonly once
        if(this.piece.swapped){
            return;
        }
        this.swapPieces();
        this.piece.swapped = true;
        return this.piece;
    }

    getLinesClearedPoints(lines, level){
        const lineClearPoints =
        lines === 1 
            ? POINTS.SINGLE
            : lines === 2 
            ? POINTS.DOUBLE
            : lines === 3 
            ? POINTS.TRIPLE
            : lines === 4 
            ? POINTS.TETRIS
            : 0;
        return (account.level + 1) * lineClearPoints;
    }
}