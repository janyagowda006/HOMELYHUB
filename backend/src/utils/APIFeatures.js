// ---- APIFeatures: builds search, filter, sort, and pagination query ----
// Keeps controller code clean and maintainable:
//     const features = new APIFeatures(Property.find(), req.query)
//       .filter()
//       .search()
//       .sort()
//       .limitFields()
//       .paginate();
//     const properties = await features.query;

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString || {};
  }

  // 1. FILTER: handles price ranges, propertyType, roomType, amenities, etc.
  filter() {
    const filterQuery = {};
    const queryObj = { ...this.queryString };

    // --- PRICE FILTER ---
    if (
      (queryObj.minPrice !== undefined && queryObj.minPrice !== "") ||
      (queryObj.maxPrice !== undefined && queryObj.maxPrice !== "")
    ) {
      filterQuery.price = filterQuery.price || {};

      if (queryObj.minPrice !== undefined && queryObj.minPrice !== "") {
        const min = Number(queryObj.minPrice);
        if (!isNaN(min)) filterQuery.price.$gte = min;
      }

      if (queryObj.maxPrice !== undefined && queryObj.maxPrice !== "") {
        if (typeof queryObj.maxPrice === "string" && queryObj.maxPrice.includes(">")) {
          const min = Number(queryObj.maxPrice.replace(">", "").trim());
          if (!isNaN(min)) filterQuery.price.$gte = min;
        } else {
          const max = Number(queryObj.maxPrice);
          if (!isNaN(max)) filterQuery.price.$lte = max;
        }
      }
    }

    // Support direct price queries like ?price[gte]=1000&price[lte]=5000 or ?price=3000
    if (queryObj.price !== undefined && queryObj.price !== "") {
      if (typeof queryObj.price === "object") {
        filterQuery.price = filterQuery.price || {};
        for (const [key, val] of Object.entries(queryObj.price)) {
          if (["gte", "gt", "lte", "lt"].includes(key)) {
            const num = Number(val);
            if (!isNaN(num)) filterQuery.price[`$${key}`] = num;
          }
        }
      } else {
        const exactPrice = Number(queryObj.price);
        if (!isNaN(exactPrice)) filterQuery.price = exactPrice;
      }
    }

    // --- PROPERTY TYPE FILTER ---
    if (queryObj.propertyType) {
      const typeArray = Array.isArray(queryObj.propertyType)
        ? queryObj.propertyType
        : queryObj.propertyType.split(",").map((v) => v.trim());
      filterQuery.propertyType = {
        $in: typeArray.map((v) => new RegExp(`^${v.replace(/-/g, "[ -]?")}$`, "i")),
      };
    }

    // --- ROOM TYPE FILTER ---
    if (queryObj.roomType) {
      const roomArray = Array.isArray(queryObj.roomType)
        ? queryObj.roomType
        : queryObj.roomType.split(",").map((v) => v.trim());
      filterQuery.roomType = {
        $in: roomArray.map((v) => new RegExp(`^${v}$`, "i")),
      };
    }

    // --- AMENITIES FILTER ---
    if (queryObj.amenities) {
      const amenitiesArray = Array.isArray(queryObj.amenities)
        ? queryObj.amenities
        : queryObj.amenities.split(",").map((v) => v.trim());

      filterQuery["amenities.name"] = {
        $all: amenitiesArray.map((v) => new RegExp(`^${v}$`, "i")),
      };
    }

    // --- MINIMUM RATING ---
    if (queryObj.ratingsAverage || queryObj.minRating) {
      const rating = Number(queryObj.ratingsAverage || queryObj.minRating);
      if (!isNaN(rating)) filterQuery.ratingsAverage = { $gte: rating };
    }

    // --- AVAILABILITY ---
    if (queryObj.isAvailable !== undefined) {
      filterQuery.isAvailable = queryObj.isAvailable === "true" || queryObj.isAvailable === true;
    }

    this.query = this.query.find(filterQuery);
    return this;
  }

  // 2. SEARCH: destination/city/area/keyword, guests count, date availability
  search() {
    const searchQuery = {};
    const queryObj = { ...this.queryString };

    // --- CITY / AREA / LOCATION / KEYWORD SEARCH ---
    const searchParam = queryObj.city || queryObj.search || queryObj.destination || queryObj.location;
    if (searchParam && typeof searchParam === "string" && searchParam.trim().length > 0) {
      const term = searchParam.trim();
      const regex = new RegExp(term, "i");
      searchQuery.$or = [
        { "address.city": regex },
        { "address.area": regex },
        { "address.state": regex },
        { "address.country": regex },
        { "address.street": regex },
        { "address.landmark": regex },
        { propertyName: regex },
      ];
    }

    // --- GUESTS COUNT ---
    const guests = queryObj.guests || queryObj.maximumGuest || queryObj.maximunGuest;
    if (guests) {
      const guestNum = Number(guests);
      if (!isNaN(guestNum)) {
        searchQuery.maximumGuest = { $gte: guestNum };
      }
    }

    // --- DATE AVAILABILITY ---
    if (queryObj.dateIn && queryObj.dateOut) {
      const checkInDate = new Date(queryObj.dateIn);
      const checkOutDate = new Date(queryObj.dateOut);

      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime())) {
        searchQuery.currentBookings = {
          $not: {
            $elemMatch: {
              fromDate: { $lt: checkOutDate },
              toDate: { $gt: checkInDate },
            },
          },
        };
      }
    }

    this.query = this.query.find(searchQuery);
    return this;
  }

  // 3. SORT: handles friendly aliases and standard Mongoose sort strings
  sort() {
    if (this.queryString.sort) {
      let sortBy = this.queryString.sort;

      if (sortBy === "price-asc" || sortBy === "price_asc" || sortBy === "lowest-price") {
        sortBy = "price";
      } else if (sortBy === "price-desc" || sortBy === "price_desc" || sortBy === "highest-price") {
        sortBy = "-price";
      } else if (sortBy === "top-rated" || sortBy === "rating") {
        sortBy = "-ratingsAverage";
      } else if (sortBy === "newest" || sortBy === "latest") {
        sortBy = "-createdAt";
      } else {
        sortBy = sortBy.split(",").join(" ");
      }

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  // 4. LIMIT FIELDS: project only requested fields
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  // 5. PAGINATION: handles page and limit safely
  paginate() {
    const page = Math.max(Number(this.queryString.page) || 1, 1);
    const limit = Math.max(Number(this.queryString.limit) || 12, 1);
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

export { APIFeatures };
export default APIFeatures;
