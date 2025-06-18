import { getToken } from "../../utils/auth-service";
import * as DicodingAPI from "../../data/api";

export default class HomePresenter {
  #view;
  #model;

  constructor({ view, model = DicodingAPI }) {
    this.#view = view;
    this.#model = model;
  }

  async loadStories() {
    try {
      const token = getToken();

      if (!token) {
        this.#view.showLoginRequired();
        return;
      }

      const result = await this.#model.getStories({ token });

      if (result.error) {
        throw new Error(result.message);
      }

      const stories = result.data?.listStory;

      if (!stories || stories.length === 0) {
        this.#view.showEmptyStories();
        return;
      }

      this.#view.displayStories(stories);
    } catch (err) {
      console.error("loadStories: error:", err);

      if (!navigator.onLine) {
        this.#view.showOfflineFallback();
      } else {
        this.#view.showError(err.message);
      }
    }
  }
}
