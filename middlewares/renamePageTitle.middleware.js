const renamePageTitle = function (page_name) {
  return function (req, res, next) {
    res.locals.html = true;
    res.locals.title = `${page_name} - ${process.env.APPLICATION_NAME}`;
    res.locals.userData = res.locals.userData || {};
    res.locals.error = {};
    res.locals.data = {};

    next();
  };
};

// export codes

export default renamePageTitle;
