# Specification

### Pitch

Introducing StrataMind - the ultimate AI-powered business optimization solution designed specifically for small businesses and new business owners. Our software analyzes your company's operations, identifies inefficiencies and bottlenecks, and provides tailored recommendations to streamline your processes, improve productivity, and drive revenue growth. With Processeon, you can take your small business to the next level, competing with larger organizations without breaking the bank on business analysts and contractors. Say goodbye to guesswork and hello to data-driven decision making.

### Renderings

Here are your common signup and login pages:

<img src="./Images/Signup%20Spec.png" alt="Signup Page" width="500" />

<img src="./Images/Login%20Spec.png" alt="Login Page" width="500" />


### Main User Interface

The user will input as much information as possible about his business, such as the business model, the product or service they provide, and most-importantly, their business processes. These can be things such as client acquisition, marketing efforts, click funneling techniques, etc... The user creates a flow chart for these processes. Once the user hits "analyze", a large language model AI such as ChatGPT or Google Bard will take all the business data, and provide critiques, suggestions, and modifications for that specific process, given the context of the business, product, market, and more. The use can then edit the flow chart and reanalyze.

 ![Main Page](./Images/New%20Main%20Spec.png)

### Key Features

- Secure login over HTTPS
- Ability to create intuitive processes in the form of a flow chart
- Securely send information to a LLM by use of an API integration
- Analysis of specific processes contains context of all other processes and the business at large

### Technologies

- ********HTML******** - Uses correct HTML structure. Three HTML pages. One for signup, one for logging in, and one for main work. The main page will be dynamic and allow the user to view multiple items on a single page.
- **CSS -** The application will be appropriately and cleanly styled for the target market: small business owners.
- ********************JavaScript******************** - Provides interactivity with the pages, showing different content given menu selection and sending API data.
- **************Service************** - Backend service with endpoints for:
    - login
    - working with the API
    - sending analysis returned by API
- ****Database**** - Storing users’ data about their business, along with their personal information.
- ****************Login**************** - Register and log in users.
- ******************WebSocket****************** - As the API data is returned, the text will be relayed to the analysis pane
- **********React********** - App will be using the React web framework.

### Layout Concept
<img src="./Images/Process%20concept.png" alt="Login Page" width="500" />
