requirejs( [], function () {

    // Class
    function Overview(path, description) {
        this.path = path;
        this.description = description; 
    }

    Overview.prototype.save = function () {
        return db.folders.put(this);
    }

    return Overview;

});
