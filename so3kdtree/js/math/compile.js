define(function() {
    function notNull(x) { return !!x; }

    function flatten(source) {
        return ((source instanceof Array)
                ? source.filter(notNull).map(flatten).join("\n")
                : source);
    }

    function compile(name, args, source) {
        source = flatten(source)
            .replace(/\$(\{([^\}]*)\}|\w+)/g, function(m, expr, word) {
                return flatten(ctx(expr));
            });
        source = "(function "+name+" ("+args+") {\n" + str + "\n})";
        return eval(source);
    }

    return compile;
});
