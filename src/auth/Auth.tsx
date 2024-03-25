import { FormEvent, useState } from "react"
import { useAuthSession } from "./AuthSessionContext";
import { Navigate } from "react-router-dom";
import styles from "../utils.module.css";
import { supabase } from "../supabaseClient";

export const Auth = () => {
    const [ loading, setLoading ] = useState(false);
    const [ email, setEmail ] = useState("");
    const { session } = useAuthSession();

    const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setLoading(true)
            const { error } = await supabase.auth.signInWithOtp({ email });

            if (error) {
                throw Error
            }
            alert("Check your email for the login link");
        }
        catch (error) {
            alert(error)
        } finally {
            setLoading(false);
        }
    }

    if (session) {
        return <Navigate to="/" />
    }

    return (
        <div className={styles.centeredFlex}>
            <div>
                <h1>Parker's Notion Clone</h1>
                <p>Sign in via login link with your email below</p>
                {loading ? ("Sending login link...") : (
                    <form onSubmit={handleLogin}>
                        <label htmlFor="email">Email: </label>
                        <input type="email" 
                        id="email" 
                        value={email}
                        placeholder="Your email"
                        onChange={e => setEmail(e.target.value)}></input>
                        <button>
                            Send login link
                        </button>
                    </form>
                )}
            </div>
        </div>
    )

}