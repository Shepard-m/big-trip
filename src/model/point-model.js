import { UpdateType } from "../const.js";
import { render } from "../framework/render.js";
import Observable from "../framework/observable.js";
import ErrorServerView from "../view/error-server-view.js";

export default class PointModel extends Observable {
  #points = [];
  #offers = [];
  #destinations = [];
  #pointApiService = null;
  #errorServerView = null;
  isErrorServer = null;
  #contentContainer = null;

  constructor({ pointApiService, contentContainer }) {
    super();

    this.#pointApiService = pointApiService;
    this.#contentContainer = contentContainer;
  }

  #adaptToClient(point) {
    const adaptedToClient = {
      ...point,
      price: point["base_price"],
      startDate:
        point["date_from"] !== null
          ? new Date(point["date_from"])
          : point["date_from"],
      endDate:
        point["date_to"] !== null
          ? new Date(point["date_to"])
          : point["date_to"],
      typePoint: point["type"],
      isFavourite: point["is_favorite"],
      destinationId: point["destination"],
    };

    delete adaptedToClient["base_price"];
    delete adaptedToClient["date_from"];
    delete adaptedToClient["date_to"];
    delete adaptedToClient["type"];
    delete adaptedToClient["is_favorite"];
    delete adaptedToClient["destination"];

    return adaptedToClient;
  }

  async init() {
    try {
      const points = await this.#pointApiService.points;
      this.#points = points.map(this.#adaptToClient);
      this.#destinations = await this.#pointApiService.destinations;
      this.#offers = await this.#pointApiService.offers;
      this.isErrorServer = false;
    } catch (err) {
      this.#points = [];
      this.#destinations = [];
      this.#offers = [];
      this.isErrorServer = true;
      this.#errorServerView = new ErrorServerView();
      render(this.#errorServerView, this.#contentContainer);
    }

    this._notify(UpdateType.INIT);
  }

  get points() {
    return this.#points;
  }

  get offers() {
    return this.#offers;
  }

  get destinations() {
    return this.#destinations;
  }

  getOfferByType(type) {
    const allOffers = this.#offers;
    return allOffers.find((offer) => offer.type === type);
  }

  getOfferById(type, pointId) {
    const offersType = this.getOfferByType(type);
    return offersType.offers.filter((item) =>
      pointId.find((id) => item.id === id)
    );
  }

  getDestinationsById(id) {
    const allDestinations = this.#destinations;
    const destination = allDestinations.find((item) => item.id === id);
    return destination !== undefined ? destination : null;
  }

  async updatePoint(updateType, update) {
    const index = this.#points.findIndex((point) => point.id === update.id);

    if (index === -1) {
      throw new Error("Can't update unexisting task");
    }

    try {
      const response = await this.#pointApiService.updatePoint(update);
      const updatePoint = this.#adaptToClient(response);

      this.#points = [
        ...this.#points.slice(0, index),
        updatePoint,
        ...this.#points.slice(index + 1),
      ];

      this._notify(updateType, update);
    } catch (err) {
      throw new Error("Can't update point");
    }
  }

  async addPoints(updateType, update) {
    try {
      const response = await this.#pointApiService.addPoint(update);
      const newPoint = this.#adaptToClient(response);
      this.#points = [newPoint, ...this.#points];

      this._notify(updateType, newPoint);
    } catch (err) {
      throw new Error("Can't add task");
    }
  }

  async deletePoints(updateType, update) {
    const index = this.#points.findIndex((point) => point.id === update.id);

    if (index === -1) {
      throw new Error("Can't update unexisting task");
    }

    try {
      await this.#pointApiService.deletePoint(update);
      this.#points = [
        ...this.#points.slice(0, index),
        ...this.#points.slice(index + 1),
      ];

      this._notify(updateType, update);
    } catch (err) {
      throw new Error("Can't delete task");
    }
  }
}
