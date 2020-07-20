define(function() {

    function KDNode() {
    }

    KDNode.prototype = {
        point : null,
        axis : null,
        split : null,
        left : null,
        right : null
    };
    KDNode.leaf = function (pt) {
        var n = new KDNode();
        n.point = pt;
        return n;
    };
    KDNode.branch = function (axis, split, left, right) {
        var n = new KDNode();
        n.axis = axis;
        n.split = split;
        n.left = left;
        n.right = right;
        return n;
    };

    return KDNode;
});
