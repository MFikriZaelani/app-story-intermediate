import HomePage from "../pages/home/home-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import DetailPage from "../pages/detail/detail-page";
import AddStoryPage from "../pages/add/add-story-page";
import SavePage from "../pages/save/save-story-page";

const routes = {
  "/": new HomePage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/detail/:id": new DetailPage(),
  "/add": new AddStoryPage(),
  "/favorite": new SavePage(),
};

export default routes;
