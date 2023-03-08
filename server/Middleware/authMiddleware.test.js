import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../Models/UserModel.js";
import { protect, admin } from "./authMiddleware.js";

describe("protect middleware", () => {
  it("should call next() if valid token is provided", async () => {
    const user = new User({
      _id: "123",
      name: "Test User",
      email: "test@example.com",
      password: "test123",
      isAdmin: false,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    const res = {};
    const next = jest.fn();

    jest.spyOn(jwt, "verify").mockImplementation(() => {
      return { id: user._id };
    });
    jest.spyOn(User, "findById").mockImplementation(() => {
      return user;
    });

    await protect(req, res, next);

    expect(req.user).toBeDefined();
    expect(req.user._id).toEqual(user._id);
    expect(next).toHaveBeenCalled();
  });

  it("should return 401 if invalid token is provided", async () => {
    const req = {
      headers: {
        authorization: "Bearer invalidtoken",
      },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    const next = jest.fn();

    jest.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("Invalid token");
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      message: "Not authorized, token failed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if no token is provided", async () => {
    const req = {
      headers: {},
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      message: "Not authorized, no token",
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe("admin middleware", () => {
  it("should call next() if user is an admin", () => {
    const req = {
      user: {
        isAdmin: true,
      },
    };
    const res = {};
    const next = jest.fn();

    admin(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 401 if user is not an admin", () => {
    const req = {
      user: {
        isAdmin: false,
      },
    };
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(),
    };
    const next = jest.fn();

    admin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      message: "Not authorized as an Admin",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
