// gameplay
// declaration
const BOARD = {
    height: 6,
    width : 7
}; // height, width
const EVALUATION_TABLE = [[3, 4,  5,  7,  5, 4, 3], 
                          [4, 6,  8, 10,  8, 6, 4],
                          [5, 8, 11, 13, 11, 8, 5], 
                          [5, 8, 11, 13, 11, 8, 5],
                          [4, 6,  8, 10,  8, 6, 4],
                          [3, 4,  5,  7,  5, 4, 3]];
let board, turn, player_turn, computer_turn, is_game;

function initialize_game() {
    turn = 1;
    player_turn = $('#play_first').is(':checked') ? 1 : 2;
    computer_turn = player_turn == 1 ? 2 : 1;
    is_game = true;
    board = []
    for (let i = 0; i < BOARD.height; i++) {
        board.push(Array.from(Array(BOARD.width), () => 0))      
    }
    // console.table(board);
    draw_board();

    computer_move();
}

function draw_board() {
    let board_HTML = document.getElementById("board");
    board_HTML.innerHTML = ""
    for (let i = 0; i < BOARD.height; i++){
        // create row
        let row_HTML = document.createElement("div");
        row_HTML.className = "row";
        for (let j = 0; j < BOARD.width; j++){
            // create column
            let content = board[i][j] == 0 ? `<div class='smoothfade empty-tile'></div>` : board[i][j] == 1 ? `<div class='smoothfade first-player empty-tile'></div>` : `<div class='smoothfade second-player empty-tile'></div>`;
            let col_HTML = `<div class='tile' onclick='place_piece(${i},${j})'>${content}</div>`
            row_HTML.innerHTML += (col_HTML);
        }
        board_HTML.appendChild(row_HTML);
    }  
}

function available_row(selected_column, state = board){
    let row = -1;
    for (let r = 0; r < BOARD.height; r++)
        if (state[r][selected_column] == 0)
            row = r;
    return row
}

function computer_move(){
    if (computer_turn == turn){
        ai_move = alpha_beta_pruning(board);
        if (ai_move[1] == BOARD.height-1 && board[ai_move[1]][ai_move[2]] == computer_turn) {
            for (let i = BOARD.height-1; i > 0 ; i--) {
                board[i][ai_move[2]] = board[i-1][ai_move[2]];
            }
            board[0][ai_move[2]] = 0;
        } else board[ai_move[1]][ai_move[2]] = computer_turn; 
        turn = turn == 1 ? 2 : 1;

        draw_board();
    }
}

function place_piece(selected_row, selected_column) {
    if (is_game) {
        if (selected_row == BOARD.height-1 && board[selected_row][selected_column] == player_turn){
            for (let i = BOARD.height-1; i > 0 ; i--) {
                board[i][selected_column] = board[i-1][selected_column];
            }
            board[0][selected_column] = 0;
            turn = turn == 1 ? 2 : 1;
        } else {
            let row = available_row(selected_column);
            // invalid move
            if (row == -1) alert("Invalid Move!"); 
            else { 
                board[row][selected_column] = player_turn; 
                turn = turn == 1 ? 2 : 1;
            }
        }
        // check win condition
        let winner = check_win_condition(board);
        if (winner != 0) { 
            Swal.fire(
                `Player ${winner} Win!`,
                'Congratulations!!',
                'success'
              ) 
            is_game = false;
        } else {
            // ai turn
            computer_move();
            winner = check_win_condition(board);
            if (winner != 0) { 
                Swal.fire(
                    `Computer Win!`,
                    'Congratulations!!',
                    'success'
                  )
                is_game = false;
            }
        }
        draw_board();
    }
}

function check_win_condition(state){
    let height = BOARD.height;
    let width = BOARD.width;
    for (let r = 0; r < height; r++) { // iterate rows, bottom to top
        for (let c = 0; c < width; c++) { // iterate columns, left to right
            let player = state[r][c];
            if (player == 0)
                continue; // don't check empty slots

            if (c + 3 < width &&
                player == state[r][c+1] && // look right
                player == state[r][c+2] &&
                player == state[r][c+3])
                return player;
            if (r + 3 < height) {
                if (player == state[r+1][c] && // look down
                    player == state[r+2][c] &&
                    player == state[r+3][c])
                    return player;
                if (c + 3 < width &&
                    player == state[r+1][c+1] && // look down & right
                    player == state[r+2][c+2] &&
                    player == state[r+3][c+3])
                    return player;
                if (c - 3 >= 0 &&
                    player == state[r+1][c-1] && // look down & left
                    player == state[r+2][c-2] &&
                    player == state[r+3][c-3])
                    return player;
            }
        }
    }
    return 0;
}

// function board_is_full(state){
//     for (let i = 0; i < BOARD.height; col++)
//         for (let j = 0; j < BOARD.width; j++) 
//             if (state[i][j] != 0) return false;
//     return true;
// }

// main program
$(()=>{
    initialize_game();
});


// AI
function all_valid_move(state, player) {
    // [0] => row
    // [1] => col
    let all_valid_moves = [];
    for (let col = 0; col < BOARD.width; col++)
        if (available_row(col, state) != -1)
            all_valid_moves.push([available_row(col, state), col]);

    for (let col = 0; col < BOARD.width; col++) {
        if (state[BOARD.height-1][col] == player)
            all_valid_moves.push([BOARD.height-1, col]);
    }
    return all_valid_moves;
}

function evaluate(state, depth) {
    let winner = check_win_condition(state);
    if (winner == computer_turn) { 
        // console.log("Win!");
        return 10000 - (depth * 10); 
    }
    else if (winner == player_turn) { 
        // console.log("Lose!");
        return -10000; 
    }
    else {
        let score = 0;
        let height = BOARD.height;
        let width = BOARD.width;
        for (let r = 0; r < height; r++) { // iterate rows, bottom to top
            for (let c = 0; c < width; c++) { // iterate columns, left to right
                if (state[r][c] == 0)
                    continue; // don't check empty slots

                // computer
                if(c + 2 < width && 
                    computer_turn == state[r][c+1] && // look right
                    computer_turn == state[r][c+2])
                    score += 5;
                // player
                if(c + 2 < width && 
                    player_turn == state[r][c+1] && // look right
                    player_turn == state[r][c+2])
                    score -= 5;
                if (r + 2 < height){
                    // computer
                    if (computer_turn == state[r+1][c] && // look up
                        computer_turn == state[r+2][c])
                        score += 5;
                    if (c + 2 < width &&
                        computer_turn == state[r+1][c+1] && // look up & right
                        computer_turn == state[r+2][c+2])
                        score += 5;
                    if (c - 2 >= 0 &&
                        computer_turn == state[r+1][c-1] && // look up & left
                        computer_turn == state[r+2][c-2])
                        score += 5;
                    // player
                    if (player_turn == state[r+1][c] && // look up
                        player_turn == state[r+2][c])
                        score -= 5;
                    if (c + 2 < width &&
                        player_turn == state[r+1][c+1] && // look up & right
                        player_turn == state[r+2][c+2])
                        score -= 5;
                    if (c - 2 >= 0 &&
                        player_turn == state[r+1][c-1] && // look up & left
                        player_turn == state[r+2][c-2])
                        score -= 5;
                }
            }
        }

        // heuristic 
        for (let i=0;i<BOARD.height;i++){
            for(let j=0;j<BOARD.width;j++){
                if (state[i][j] == computer_turn)
                    score += EVALUATION_TABLE[i][j];
                else (state[i][j] == player_turn)
                    score -= EVALUATION_TABLE[i][j];
            }
        }
        return score;
    }

}

let state_taken;
function alpha_beta_pruning(state, depth = 0, is_max = true, alpha = -Infinity, beta = Infinity){
    let tree_depth = $('#tree_depth').val() * 1;

    let best = is_max ? [-Infinity,-1,-1] : [Infinity,-1,-1];
    if (depth == tree_depth || check_win_condition(state) != 0){ 
        // console.log(`Depth:${depth}, Score:${evaluate(state)}`)
        // console.table(state);
        // console.log('Score :'+evaluate(state));
        return [evaluate(state, depth), -1, -1];
    }
    
    all_valid_move(state, is_max ? computer_turn : player_turn).forEach((position)=>{
        let row = position[0];
        let col = position[1];
      
        let next_state = JSON.parse(JSON.stringify(state));

        if (next_state[row][col] == 0) 
            next_state[row][col] = is_max ? computer_turn : player_turn;
        else if (next_state[row][col] == is_max ? computer_turn : player_turn){
            for (let i = BOARD.height-1; i > 0 ; i--) {
                next_state[i][col] = next_state[i-1][col];
            }
            next_state[0][col] = 0;
        }

        let score = alpha_beta_pruning(next_state, depth + 1, !is_max, alpha, beta)
        score[1] = row;
        score[2] = col;

        if (is_max && best[0] < score[0]) {
            best = JSON.parse(JSON.stringify(score));
            state_taken = JSON.parse(JSON.stringify(next_state));
            alpha = Math.max(best[0], alpha);
        } else if(!is_max && best[0] > score[0]) {
            best = JSON.parse(JSON.stringify(score));
            state_taken = JSON.parse(JSON.stringify(next_state));
            beta = Math.min(best[0], beta);
        }
        // if (depth == 0) {
        //     $("#static_board_evaluator").html(`Score:${best[0]} => {${best[1]},${best[2]}}`);
        //     console.log(`Depth:${depth}, Score:${best[0]} => {${best[1]},${best[2]}}`)
        // }
        if (alpha >= beta) {
            // console.log("Pruning!");
            return ;
        }
    });
    if (depth == 0) {
        $("#static_board_evaluator").html(`<br>Score:${best[0]} => {${best[1]},${best[2]}}`);
        console.log(`Depth:${depth}, Score:${best[0]} => {${best[1]},${best[2]}}`)
    }
    return best;
}