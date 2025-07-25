import React from "react";

function Error() {
    return (
        <div className="errorpage">
            <div className="error-div">
                <div className="error-text">
                    <p>Oops!</p>
                    <p>Something Went Wrong.</p>
                    <p>404 Page Not Found</p>
                </div>
                <div className="error-back-to-home-div">
                    <a href="/" classname="bn3">
                        Back to Home
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Error;
