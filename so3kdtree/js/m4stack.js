define(["math/m4"], function(m4) {
    function M4Stack() {
        this.stack = [];
        this.index = 0;
    }
    M4Stack.prototype = {
        push : function(m) {
            if (this.index > 32) {
                throw new RangeError("stack size exceeded");
            }

            if (this.stack.length == this.index) {
                this.stack.push(new Float32Array(16));
            }
            m4.copy(this.stack[this.index++], m);
        },
        pop : function(m) {
            if (this.index <= 0) {
                throw new RangeError("pop from empty stack");
            }

            m4.copy(m, this.stack[--this.index]);
        },
        nest : function (m, fn) {
            this.push(m);
            try {
                fn();
            } finally {
                this.pop(m);
            }
        }
    };

    return M4Stack;
});
