module.exports = function(mongoose) {
    var PostSchema = mongoose.Schema(
        {
            author: String,
            title: { type: String, unique: true},
            date: Date,
            markdown: Buffer,
            tags: [String],
            series: { data: String, default: '' }
        }
    );
    var model = {
        Post: mongoose.model('Post', PostSchema)
    };
    return model;
}
