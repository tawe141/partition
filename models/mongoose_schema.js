module.exports = function(mongoose) {
    var PostSchema = mongoose.Schema(
        {
            author: String,
            title: { type: String, unique: true},
            date: Date,
            markdown: Buffer,
            tags: [String],
            series: { data: String, default: '' },
            hash: Number,
            hidden: { type: Boolean, default: false }
        },
        {
            timestamps: true
        }
    );
    var model = {
        Post: mongoose.model('Post', PostSchema)
    };
    return model;
}
