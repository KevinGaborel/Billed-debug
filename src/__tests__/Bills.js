/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js"; //une classe
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

function renderRouter(){
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee',
    email: 'a@a'
  }));
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
}


describe("Given I am connected as an employee", () => { //Étant donné que je suis connecté en tant qu'employé

  describe("When I am on Bills Page", () => { //Quand je suis sur la page Factures
    test("Then bill icon in vertical layout should be highlighted", async () => { 
    //Alors, l'icône de la facture dans la disposition verticale doit être mise en surbrillance
      renderRouter();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window');
      //si l'icon bills à bien la classe 'active-icon'
      expect(windowIcon.classList.contains('active-icon')).toEqual(true);

    })

    test("Then bills should be ordered from earliest to latest", () => { //Alors, les factures doivent être triée de la plus ancienne à la plus récente
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    })
  })

  describe("When i click on NewBill button", ()=> { // quand je clique sur le boutton nouvelle note de frais
    test("Then, the route change for '#employee/bill/new' ", async () => { 
      //Alors la fonction handleClickNewBill() est appelé, la route change 

      renderRouter();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('btn-new-bill'));
      const btnNewBill = screen.getByTestId('btn-new-bill');

      const openNewBillPage = jest.fn(Bills.handleClickNewBill);
      btnNewBill.addEventListener("click", openNewBillPage);

      btnNewBill.click();

      expect(openNewBillPage).toHaveBeenCalled(); // je vérifie que l'event est appelé
      expect(window.location.href).toBe("http://localhost/#employee/bill/new");

    })
  })

  describe("When i click on eye button in the 'action' category", ()=> { // quand je clique sur le boutton oeil de la catégorie "action"
    test("Then, show the modal. ", async () => { 
      //Alors montre la modale. 

      $.fn.modal = jest.fn();

      renderRouter();
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getAllByTestId('icon-eye')[0]);
      const btnEyeShowModal = screen.getAllByTestId('icon-eye')[0];

      const showModal = jest.fn(Bills.handleClickIconEye);

      btnEyeShowModal.addEventListener('click', showModal(btnEyeShowModal));

      btnEyeShowModal.click();

      expect(showModal).toHaveBeenCalled();
      expect(screen.getByText("Justificatif")).toBeTruthy();
      expect(screen.queryByAltText("Bill")).toBeTruthy(); 

    })
  })


  // test d'intégration GET
  describe("Given I am a user connected as Employee", () => {
    describe("When I navigate to Bills", () => {
      test("fetches bills from mock API GET", async () => {
        renderRouter();
        window.onNavigate(ROUTES_PATH.Bills);

        await waitFor(() => screen.getByText("Transports"));
        const titlePage  = await screen.getByText("Mes notes de frais");
        const tabBills  = await screen.getByText("Type");
        
        expect(titlePage).toBeTruthy();
        expect(tabBills).toBeTruthy();
        expect(screen.getAllByTestId("icon-eye")[0]).toBeTruthy();
      })


    describe("When an error occurs on API", () => {

      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        //renderRouter();
      })
      test("fetches bills from an API and fails with 404 message error", async () => {
      
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }});

        const html = BillsUI({ error: "Erreur 404" });
        document.body.innerHTML = html;

        //await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();

      })
    
      test("fetches messages from an API and fails with 500 message error", async () => {
      
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
        
        //await new Promise(process.nextTick);

        const html = BillsUI({ error: "Erreur 500" });
        document.body.innerHTML = html;

        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })


    })
  })

})
