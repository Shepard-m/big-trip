import AbstractView from '../framework/view/abstract-view.js';
import { humanizeOrderData } from '../utils/date.js';
import { sortPointsByDay } from '../utils/point.js';
import { FormatTime } from '../const.js';

function createData(pointModel) {
  const points = [...pointModel.points];
  points.sort(sortPointsByDay);
  let textData = '';

  if (points.length !== 0) {
    textData = `${humanizeOrderData(points[0].startDate, FormatTime.TIME_FORMAT_MMM_DD)} &nbsp;&mdash;&nbsp; ${humanizeOrderData(points[points.length - 1].endDate, FormatTime.TIME_FORMAT_MMM_DD)}`;
  }
  return `
    <p class="trip-info__dates">${textData}</p>
  `;
}

export default class InfoDayView extends AbstractView{
  #pointModel = null;
  constructor(pointModel) {
    super();
    this.#pointModel = pointModel;
  }

  get template() {
    return createData(this.#pointModel);
  }
}
