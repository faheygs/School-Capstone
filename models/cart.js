module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {};
    this.totalQty = oldCart.totalQty || 0;
    this.totalPrice = oldCart.totalPrice || 0;

    this.add = function(item, id, qty) {
        var num_qty = Number(qty);
        var storedItem = this.items[id];
        if (!storedItem) {
            storedItem = this.items[id] = {item: item, qty: 0, price: 0};
        }
        storedItem.qty += num_qty;
        storedItem.local_price = storedItem.item.price.toFixed(2) * storedItem.qty;
        this.totalQty += num_qty;
        this.totalPrice += storedItem.item.price.toFixed(2) * num_qty;
    };

    this.reduceByOne = function(id) {
        this.items[id].qty--;
        this.items[id].local_price -= this.items[id].item.price.toFixed(2);
        this.totalQty--;
        this.totalPrice -= this.items[id].item.price.toFixed(2);

        if (this.items[id].qty <= 0) {
            delete this.items[id];
        }
    };

    this.removeItem = function(id) {
        this.totalQty -= this.items[id].qty;
        this.totalPrice -= this.items[id].local_price;
        delete this.items[id];
    }

    this.generateArray = function() {
        var arr = [];
        for (var id in this.items) {
            arr.push(this.items[id]);
        }
        return arr;
    };
};