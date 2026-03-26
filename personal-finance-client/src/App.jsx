import React from 'react';
import Auth from './components/Auth/Auth';

function App() {
    return (
        <div className="app-container">
            {/* כרגע אנחנו מציגים רק את מסך ההתחברות, בהמשך נוסיף פה את הניווט (Router) */}
            <Auth />
        </div>
    );
}

export default App;