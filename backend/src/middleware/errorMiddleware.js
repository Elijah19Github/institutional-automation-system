const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    // console.error(err.stack); // uncomment in ultimate prod debug

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { errorHandler };
