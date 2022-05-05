import React from "react";

export default function UserCard(props) {
  let { user } = props;

  return (
    <div
      className="p-6 border border-gray-100 rounded-xl bg-gray-50 sm:flex sm:space-x-8 sm:p-8 mb-5"
      style={{ minHeight: "150px" }}
    >
      {user && (
        <>
          <img
            className="w-20 h-20 mx-auto rounded-full"
            src={user.picture}
            alt="user avatar"
            height="220"
            width="220"
          />
          <div className="space-y-4 mt-4 text-center sm:mt-0 sm:text-left">
            <p className="text-gray-600">
              <span className="font-serif">"</span> {user.bio}{" "}
              <span className="font-serif">"</span>
            </p>
            <div>
              <h6 className="text-lg font-semibold leading-none">
                {user.id} = {user.name} {user.surname} - {user.country}{" "}
              </h6>
              <span className="text-xs text-gray-500">{user.company}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
