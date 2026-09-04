import { AppRouter } from "./app/router";
import { AuthBootstrap } from "./auth/AuthBootstrap";

function App() {
    return (
        <AuthBootstrap>
            <AppRouter />
        </AuthBootstrap>
    );
}

export default App;
