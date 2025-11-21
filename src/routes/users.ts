import { Router } from "express";
import { createUser, deleteUser, getAllUsers, getUserById, updateUser } from "../controllers.ts/userController";
import { validateUserInput } from "../middlewares/inputValidator";
import { NodeVM } from "vm2";
import { GeneratorController } from "../controllers.ts/generatorController";

const router = Router();

/* GET users listing. */
router.post('/generate', (req, res) => {
  GeneratorController(req, res);
});
router.post('/user', validateUserInput, createUser);
router.get('/user', getAllUsers);
router.get('/user/:id', getUserById);
router.put('/user/:id', validateUserInput, updateUser);
router.delete('/user/:id', deleteUser);
router.post('/run-code', (req, res) => {
  const { code, level } = req.body;
  console.log('Received code:', code);
  console.log('Level:', level);
  
  try {
    const vm = new NodeVM({
      console: "redirect",
      sandbox: {
        // Add React-like mock if needed
        React: {
          createElement: () => ({}), // Mock React.createElement
        }
      },
      timeout: 2000,
    });

    let consoleOutput: string[] = [];
    vm.on("console.log", (msg) => consoleOutput.push(String(msg)));

    // For React components, we need different validation logic
    let passed = false;
    
    if (level === 1) {
      // Check if the code structure is correct for Level 1
      const hasHelloWorld = code.includes("Hello World");
      const hasValidFunction = code.includes("function App") || code.includes("const App");
      const hasReturn = code.includes("return");
      
      passed = hasHelloWorld && hasValidFunction && hasReturn;
    } else if (level === 2) {
      // Check for JSX basics
      const hasStartCoding = code.includes("Start coding");
      const hasValidFunction = code.includes("function App") || code.includes("const App");
      
      passed = hasStartCoding && hasValidFunction;
    } else if (level === 3) {
      // Check if App function is exported or defined
      const hasAppFunction = code.includes("function App") || code.includes("const App");
      passed = hasAppFunction;
    }

    res.json({
      passed,
      consoleOutput,
      result: "Code validation completed",
    });
    
  } catch (error) {
    console.error('Error running code:', error);
    res.json({
      passed: false,
      error: {
        message: error || "Unknown error occurred",
        name: error || "Error"
      },
      consoleOutput: []
    });
  }
});



export default router;
