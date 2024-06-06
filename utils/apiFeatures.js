class APIFeatures {
  constructor(query, queryRequest) {
    this.query = query;
    this.queryRequest = queryRequest;
  }

  filter() {
    const queryObj = { ...this.queryRequest };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryRequest.sort) {
      const sortPy = this.queryRequest.sort.replace(/,/g, " ");
      this.query = this.query.sort(sortPy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryRequest.fields) {
      const fields = this.queryRequest.fields.replace(/,/g, " ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = +this.queryRequest.page || 1;
    const limit = +this.queryRequest.limit || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
  }
}
module.exports = APIFeatures;
