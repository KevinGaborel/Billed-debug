/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import router from "../app/Router.js";
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { post } from "jquery";


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
  
  describe("When I am on NewBills Page", () => { //Quand je suis sur la page nouvelle Factures
    test("Then envelope icon in vertical layout should be highlighted", async () => { 
    //Alors, l'icône de l'enveloppe dans la disposition verticale doit être mise en surbrillance
      renderRouter();
      window.onNavigate(ROUTES_PATH.NewBill);
      const mailIcon = await waitFor(() => screen.getByTestId('icon-mail'));

      //si l'icone enveloppe à bien la classe 'active-icon'
      expect(mailIcon.classList.contains('active-icon')).toEqual(true);
  
    })

    test("Then I am on newBillPage and the form is present", () => { //Alors je suis sur newBillPage et le formulaire est présent  

      renderRouter();
      window.onNavigate(ROUTES_PATH.NewBill);

      const form = screen.getByTestId('form-new-bill');
      expect(form).toBeTruthy();
    })   


    describe("when i want to send a file by the input", ()=> { // quand je veux envoyer un fichier par l'input
      test("Then, handleChangeFile is called to check the extension", async () => { 
        //Alors handleChangeFile est appelé pour vérifier l'extension

        const onNavigate = window.onNavigate(ROUTES_PATH.NewBill);
        const html = NewBillUI();
        document.body.innerHTML = html;
        
        const newBill = new NewBill({ //instance newbill
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })
        
        const inputSendFile = await waitFor(() => screen.getByTestId('file'));
        const fileControl = jest.fn((e) =>newBill.handleChangeFile(e));
        
        inputSendFile.addEventListener("change", fileControl);

        fireEvent.change(inputSendFile, {
          target: {
            files: [new File(["image.jpeg"], "image.jpeg", { type: "image/jpeg" })],
          },
        });
    
        expect(fileControl).toHaveBeenCalled(); // je vérifie que l'event est appelé
        expect(inputSendFile.files[0].name).toBe("image.jpeg");

        //si l'image n'est pas au bon format, un message d'erreur s'affiche
        fireEvent.change(inputSendFile, {
          target: {
            files: [new File(["image.gif"], "image.gif", { type: "image/gif" })],
          },
        });

        const errorFileExtension = await waitFor(() => screen.getByText(/L'image doit être au format jpg, jpeg ou png/));
        expect(fileControl).toHaveBeenCalled(); // je vérifie que l'event est appelé
        expect(errorFileExtension).toBeTruthy();

      })
    })

    describe("When the form is correctly completed and I submit it", () =>{ //Quand le formulaire est correctement rempli et que je le soummet
      test("Then a new bill is created" , async () => { //Alors une nouvelle facture est crée
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: 'a@a'
        }));
        
        const html = NewBillUI();
        document.body.innerHTML = html;

        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({ //instance newbill
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        })

        const form = await waitFor(() => screen.getByTestId('form-new-bill'));
        
        const createBill = jest.fn((e) => newBill.handleSubmit(e));

        form.addEventListener("submit", createBill);

        fireEvent.submit(form);

        expect(createBill).toHaveBeenCalled(); // je vérifie que l'event est appelé
      })
    }) 

  })
 
 // test d'intégration POST
 describe("When I navigate to NewBill page", () => {
   test("fetches bills from mock API POST", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: 'a@a'
      }));

      document.body.innerHTML = NewBillUI();
     
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBill = new NewBill({ //instance newbill
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      })

      const update = jest.fn(mockStore.bills().update);

      const mockNewBill = {
        "id": "47qAXb6fIm2zOKkLzMro",
        "vat": "80",
        "fileUrl": "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        "status": "pending",
        "type": "Hôtel et logement",
        "commentary": "séminaire billed",
        "name": "encore",
        "fileName": "preview-facture-free-201801-pdf-1.jpg",
        "date": "2004-04-04",
        "amount": 400,
        "commentAdmin": "ok",
        "email": "a@a",
        "pct": 20
      }
      
      const updateBill = await update(mockNewBill);

      const createBill = jest.fn(newBill.handleSubmit);

      const form = screen.getByTestId('form-new-bill');
      const btnSubmit = form.querySelector('#btn-send-bill');

      form.addEventListener('submit', createBill);
      
      fireEvent.click(btnSubmit);
      fireEvent.submit(form);

      const title = await waitFor(() => screen.getByText('Mes notes de frais'));

      expect(createBill).toHaveBeenCalled();
      expect(updateBill.id).toBe("47qAXb6fIm2zOKkLzMro");
      expect(title).toBeTruthy();
    })

  })

  describe("When an error occurs on API", () => {
    //"create an invoice with POST and fails with a 404 error" créer une facture avec POST et échoue avec une erreur 404
    test("fetches error from an API and fails with 404 error", async () => {
      jest.spyOn(mockStore, "bills");
      renderRouter();

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);

      const formBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(NewBill.handleSubmit);
      formBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formBill);
    });

    test("fetches error from an API and fails with 500 error", async () => {
      jest.spyOn(mockStore, "bills");
      renderRouter();

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      
      const formBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn(NewBill.handleSubmit);
      formBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formBill);
    });
  })

})
