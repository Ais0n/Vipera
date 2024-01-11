function draw(dist) {
    const canvas = document.getElementById("display");
    if (canvas.getContext) {
        const ctx = canvas.getContext("2d");
        var x = 0;
        var y = 0;
        for (let i = 0; i < 6; i++) {
            y = i * 100 + 10;
            x = 0;
            for (let j = 0; j < 6; j++) {
                x = j * 100 + 10;
                ctx.fillStyle = `rgb(${Math.floor(255 - 42.5 * i)}, ${Math.floor(255 - 42.5 * j,)}, 0)`;
                ctx.fillRect(x, y, 90, 90);
            }
        }
    }
    else {
        alert('Browser not supported')
    }
}
var dist = ['age', ]
window.addEventListener("load", draw);
