const cloudinary = require("../config/cloudinary");

const getGalleryByDay = async (req, res) => {
    try {
        const { day } = req.params;

        const result = await cloudinary.search
            .expression(`folder:gallery/${day}`)
            .sort_by("created_at", "desc")
            .max_results(50)
            .execute();

        const images = result.resources.map((img) => img.secure_url);

        res.json(images);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch gallery" });
    }
};

module.exports = { getGalleryByDay };