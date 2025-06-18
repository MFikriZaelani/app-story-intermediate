import { getToken } from "../../utils/auth-service";
import * as DicodingAPI from "../../data/api";

class DetailPresenter {
  constructor({ view, storyId }) {
    this._view = view;
    this._storyId = storyId;
    this._initializing = false;
  }

  async loadStoryDetail() {
    try {
      this._view.showLoading();
      
      if (!navigator.onLine) {
        const cachedStory = await this._getStoryCacheById(this._storyId);
        if (cachedStory) {
          this._view.showOfflineAlert();
          this._view.renderStory(cachedStory);
          return;
        }
        throw new Error('Tidak dapat memuat cerita dalam mode offline');
      }

      const token = getToken();
      if (!token) {
        throw new Error('Token tidak valid');
      }

      const response = await DicodingAPI.getStoryDetail({
        id: this._storyId,
        token,
      });

      if (response.error) {
        throw new Error(response.message);
      }

      // Cache the successful response
      await this._cacheStoryDetail(response.story);
      this._view.renderStory(response.story);

    } catch (error) {
      console.error('Error loading story:', error);
      this._view.showError(error.message);
    } finally {
      this._view.hideLoading();
    }
  }

  async _getStoryCacheById(id) {
    try {
      const cache = await caches.open('story-cache-v1');
      const response = await cache.match(`/stories/${id}`);
      if (response) {
        const data = await response.json();
        return data.story;
      }
      return null;
    } catch (error) {
      console.error('Cache error:', error);
      return null;
    }
  }

  async _cacheStoryDetail(story) {
    try {
      const cache = await caches.open('story-cache-v1');
      const response = new Response(
        JSON.stringify({ story }), 
        { 
          headers: { 'Content-Type': 'application/json' }
        }
      );
      await cache.put(`/stories/${story.id}`, response);
    } catch (error) {
      console.error('Caching error:', error);
    }
  }
}

export default DetailPresenter;