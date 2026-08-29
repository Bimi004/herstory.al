function errorHandler(err, req, res, next) {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Gabim i brendshem i serverit'
    });
}

module.exports = errorHandler;
