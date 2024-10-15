import EditPointView from "../view/edit-point-view.js";
import PointView from "../view/point-view.js";
import AddPointView from "../view/add-new-point-view.js";
import { UserAction, UpdateType } from "../const.js";
import { isDatesEqual } from "../utils/date.js";
import {
  render,
  replace,
  remove,
  RenderPosition,
} from "../framework/render.js";

const Mode = {
  DEFAULT: "DEFAULT",
  EDITING: "EDITING",
};

export default class PointPresenter {
  #containerPoint = null;

  #pointView = null;
  #pointEditView = null;
  #pointModel = null;
  #addPointView = null;
  #noPointComponent = null;
  #renderNoPoint = null;
  #filteredPoints = null;
  #renderContents = null;

  #handlerModeChange = null;
  #handlerChangeData = null;

  #pointData = null;
  #mode = Mode.DEFAULT;

  constructor(
    containerListPoint,
    pointModel,
    onDateChange,
    onModeChange,
    noPointComponent,
    renderNoPoint,
    filteredPoints,
    renderContents
  ) {
    this.#containerPoint = containerListPoint;
    this.#pointModel = pointModel;
    this.#handlerChangeData = onDateChange;
    this.#handlerModeChange = onModeChange;
    this.#noPointComponent = noPointComponent;
    this.#renderNoPoint = renderNoPoint;
    this.#filteredPoints = filteredPoints;
    this.#renderContents = renderContents;
  }

  init(point) {
    this.#pointData = point;

    const prevPointView = this.#pointView;
    const prevPointEditView = this.#pointEditView;

    this.#pointView = new PointView({
      point: point,
      checkedOffers: [
        ...this.#pointModel.getOfferById(point.typePoint, point.offers),
      ],
      destination: this.#pointModel.getDestinationsById(point.destinationId),
      onEditPointClick: () => {
        this.#handlerSwapEditToPointClick();
      },
      onFavoriteChangeClick: this.#handlerChangeFavoriteClick,
    });

    this.#pointEditView = new EditPointView({
      point: point,
      allOffers: [...this.#pointModel.offers],
      destinations: this.#pointModel.destinations,
      onFormSubmit: this.#handlerFormEditSubmit,
      onCloseEditClick: this.#handlerCloseEdit,
      onDeletePointSubmit: this.#handlerFormDeleteEditSubmit,
    });

    if (prevPointView === null || prevPointEditView === null) {
      render(this.#pointView, this.#containerPoint);
      return;
    }

    if (this.#mode === Mode.DEFAULT) {
      replace(this.#pointView, prevPointView);
    }

    if (this.#mode === Mode.EDITING) {
      replace(this.#pointEditView, prevPointEditView);
      this.#mode = Mode.DEFAULT;
    }

    remove(prevPointView);
    remove(prevPointEditView);

    render(this.#pointView, this.#containerPoint);
  }

  resetView(modePatch) {
    if (this.#addPointView !== null) {
      this.#onClosePointAddClick();
      const newPointButton = document.querySelector(
        ".trip-main__event-add-btn"
      );
      newPointButton.disabled = false;
    }

    if (modePatch) {
      this.#handlerSwapPointToEditClick();
    }

    if (this.#mode !== Mode.DEFAULT) {
      this.#pointEditView.reset({
        point: this.#pointData,
        offers: [...this.#pointModel.offers],
        destinations: this.#pointModel.destinations,
      });
      this.#handlerSwapPointToEditClick();
    }
  }

  #handlerSwapEditToPointClick() {
    replace(this.#pointEditView, this.#pointView);
    this.#handlerModeChange();
    this.#mode = Mode.EDITING;
    document.addEventListener("keydown", this.#escKeyDownHandler);
  }

  #handlerSwapPointToEditClick() {
    this.#pointEditView.reset({
      point: this.#pointData,
      offers: [...this.#pointModel.offers],
      destinations: this.#pointModel.destinations,
    });
    replace(this.#pointView, this.#pointEditView);
    this.#mode = Mode.DEFAULT;
    document.removeEventListener("keydown", this.#escKeyDownHandler);
  }

  #escKeyDownHandler = (evt) => {
    if (evt.key === "Escape") {
      evt.preventDefault();
      this.#pointEditView.reset({
        point: this.#pointData,
        offers: [...this.#pointModel.offers],
        destinations: this.#pointModel.destinations,
      });
      this.#handlerSwapPointToEditClick();
    }
  };

  #escCloseNewPointHandler = (evt) => {
    if (evt.key === "Escape") {
      const newPointButton = document.querySelector(
        ".trip-main__event-add-btn"
      );
      newPointButton.disabled = false;
      document.removeEventListener("keydown", this.#escCloseNewPointHandler);
      this.#onClosePointAddClick();
    }
  };

  #handlerFormEditSubmit = (update) => {
    const coincidenceTime =
      isDatesEqual(this.#pointData.startDate, update.startDate) &&
      isDatesEqual(this.#pointData.endDate, update.endDate);
    const coincidencePrice = this.#pointData.price === update.price;

    document.addEventListener("keydown", this.#escKeyDownHandler);
    this.#handlerChangeData(
      UserAction.UPDATE_POINT,
      coincidenceTime && coincidencePrice ? UpdateType.PATCH : UpdateType.MINOR,
      update
    );
  };

  #handlerFormDeleteEditSubmit = (point) => {
    this.#handlerChangeData(UserAction.DELETE_POINT, UpdateType.MINOR, point);
  };

  #handlerCloseEdit = () => {
    this.#handlerSwapPointToEditClick();
    document.removeEventListener("keydown", this.#escKeyDownHandler);
  };

  #handlerChangeFavoriteClick = () => {
    this.#handlerChangeData(UserAction.UPDATE_POINT, UpdateType.MINOR, {
      ...this.#pointData,
      isFavourite: !this.#pointData.isFavourite,
    });
  };

  destroy() {
    remove(this.#pointView);
    remove(this.#pointEditView);
    remove(this.#addPointView);
  }

  onCloseNewPoint() {
    if (this.#addPointView !== null) {
      remove(this.#addPointView);
    }
  }

  renderPointAdd = () => {
    if (this.#noPointComponent !== null && this.#filteredPoints?.length === 0) {
      this.#noPointComponent = null;
    }
    if (this.#addPointView === null) {
      this.#addPointView = new AddPointView({
        offers: [...this.#pointModel.offers],
        destinations: this.#pointModel.destinations,
        handlerClosePointClick: this.#onClosePointAddClick,
        onFormSubmit: this.#onSaveNewPointSubmit,
      });
      document.addEventListener("keydown", this.#escCloseNewPointHandler);
      render(
        this.#addPointView,
        this.#containerPoint,
        RenderPosition.AFTERBEGIN
      );
    }
  };

  setAborting() {
    if (this.#mode === Mode.DEFAULT) {
      this.#pointView.shake();
      return;
    }
    document.addEventListener("keydown", this.#escKeyDownHandler);
    const resetFormState = () => {
      this.#pointEditView.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#pointEditView.shake(resetFormState);
  }

  setAbortingNewPoint() {
    this.#addPointView.shake();
    document.addEventListener("keydown", this.#escCloseNewPointHandler);
    const resetFormState = () => {
      this.#addPointView.updateElement({
        isDisabled: false,
        isSaving: false,
      });
    };

    this.#addPointView.shake(resetFormState);
  }

  setSavingEditPoint() {
    if (this.#mode === Mode.EDITING) {
      document.removeEventListener("keydown", this.#escKeyDownHandler);
      document.removeEventListener("keydown", this.#escCloseNewPointHandler);
      this.#pointEditView.updateElement({
        isDisabled: true,
        isSaving: true,
      });
    }
  }

  setSavingNewPoint() {
    document.removeEventListener("keydown", this.#escKeyDownHandler);
    document.removeEventListener("keydown", this.#escCloseNewPointHandler);
    this.#addPointView.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setDeleting() {
    document.removeEventListener("keydown", this.#escKeyDownHandler);
    document.removeEventListener("keydown", this.#escCloseNewPointHandler);
    if (this.#mode === Mode.EDITING) {
      this.#pointEditView.updateElement({
        isDisabled: true,
        isDeleting: true,
      });
    }
  }

  #onClosePointAddClick = () => {
    document.removeEventListener("keydown", this.#escCloseNewPointHandler);
    this.#addPointView.reset({
      offers: [...this.#pointModel.offers],
      destinations: this.#pointModel.destinations,
    });
    remove(this.#addPointView);
    this.#addPointView = null;

    if (
      this.#pointModel.points.length !== 0 &&
      this.#filteredPoints?.length === 0
    ) {
      this.#renderContents();
      return;
    }

    if (this.#noPointComponent === null && this.#filteredPoints?.length === 0) {
      this.#renderNoPoint();
    }
  };

  #onSaveNewPointSubmit = (point) => {
    this.#handlerChangeData(UserAction.ADD_POINT, UpdateType.MINOR, point);
  };
}
