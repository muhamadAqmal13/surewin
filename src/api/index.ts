import { Request, Response, NextFunction, Router } from "express";
import { authAdmin, authNowPayments, authUser, authCookie, authSignSureWin } from "../middlewares/auth";
import deleteCustomer from "./customer/detele/deleteCustomer";
import getCustomerById from "./customer/get/getCustomerById";
import getQrCodeAuthenticator from "./customer/get/getQrCodeAuthenticator";
import getRefreshToken from "./customer/get/getRefreshToken";
import postActivateAuthenticator from "./customer/post/postActivateAuthenticator";
import postConfirmLogin from "./customer/post/postCofirmLoginAuth";
import postCustomerLogin from "./customer/post/postCustomerLogin";
import postCustomerRegister from "./customer/post/postCustomerRegistration";
import postCustomerLogout from "./customer/post/postLogout";
import putCustomer from "./customer/put/putCustomer";
import putCustomerPassword from "./customer/put/putCustomerPassword";
import putRemoveAuthenticator from "./customer/put/putRemoveAuthenticator";
import getBalanceByCifId from "./fund/get/getBalanceByCifId";
import getCronjobCreateAndResultGame from "./game/crobjob/getCronjobCreateAndResultGame";
import getAllGames from "./game/get/getAllGames";
import getGameType from "./game/get/getGameType";
import getLatestGame from "./game/get/getLatestGame";
import getUserGameHistory from "./game/get/getUserHistory";
import postGameType from "./game/post/postGameType";
import postUserGame from "./game/post/postUserGame";
import getInvoiceByExternalInvoiceId from "./order/get/getInvoiceByExternalInvoiceId";
import getTransactionDetail from "./order/get/getTransactionDetail";
import getTransactions from "./order/get/getTransactions";
import postBackUrl from "./order/post/postBackUrl";
import postBackUrlWithdrawal from "./order/post/postBackUrlWithdrawal";
import postCashIn from "./order/post/postCashIn";
import postCashOut from "./order/post/postCashOut";
import getAllProducts from "./product/get/getAllProducts";
import getProductsByType from "./product/get/getProductsByType";
import postProduct from "./product/post/postProduct";
import getRewardBoxBonus from "./fund/get/getRewardBoxBonus";
import postOtpLoginorRegister from "./customer/post/postOtpLoginorRegister";
import getNewOtp from "./customer/get/getNewOtp";

let router = Router();

const apis = [
    // Customer
    postCustomerLogin,
    postCustomerRegister,
    getCustomerById,
    putCustomer,
    putCustomerPassword,
    deleteCustomer,
    getRefreshToken,
    postCustomerLogout,
    getQrCodeAuthenticator,
    postActivateAuthenticator,
    putRemoveAuthenticator,
    postConfirmLogin,
    postOtpLoginorRegister,
    getNewOtp,

    // Order
    postCashIn,
    postCashOut,
    postBackUrl,
    postBackUrlWithdrawal,

    // Product
    postProduct,
    getAllProducts,
    getProductsByType,

    // Game
    postGameType,
    postUserGame,
    getGameType,
    getLatestGame,
    getAllGames,
    getUserGameHistory,

    // Fund
    getBalanceByCifId,
    getRewardBoxBonus,

    // Order
    getInvoiceByExternalInvoiceId,
    getTransactions,
    getTransactionDetail,

    // Cronjob
    getCronjobCreateAndResultGame,
];

for (const api of apis) {
    let { path, method, auth } = api;
    if (!path.startsWith("/api")) {
        path = "/api" + path;
    }

    let authorization;
    if (auth === "user") {
        authorization = authUser;
    } else if (auth === "admin") {
        authorization = authAdmin;
    } else if (auth === "nowpayments") {
        authorization = authNowPayments;
    } else if (auth === "cronjob") {
        authorization = authSignSureWin;
    } else if (auth === "cookie") {
        authorization = authCookie;
    }

    const main = (req: Request, res: Response, next: NextFunction) => api.main(req, res, next).catch(next);
    if (auth === "guess") {
        router[method.toLowerCase()](path, main);
    } else {
        router[method.toLowerCase()](path, authorization, main);
    }
}

export default router;
