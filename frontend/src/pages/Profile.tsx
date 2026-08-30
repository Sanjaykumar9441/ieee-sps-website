import { useEffect, useState } from "react";  
import axios from "axios";

const Profile = () => {  
  const [profile, setProfile] = useState<any>(null);  
  const permissions = JSON.parse(localStorage.getItem("permissions") || "{}");

  const isSuperAdmin = permissions.admins === true;

  useEffect(() => {  
  if (!isSuperAdmin) {  
    fetchProfile();  
  }  
}, [isSuperAdmin]);

  const fetchProfile = async () => {  
    try {  
      const token = localStorage.getItem("token");

      const res = await axios.get(  
        "VITE_API_URL",  
        {  
          headers: {  
            Authorization: `Bearer ${token}`,  
          },  
        },  
      );

      setProfile(res.data);  
    } catch (err) {  
      console.error(err);  
    }  
  };

  if (isSuperAdmin) {  
    return (  
      <div  
        className="rounded-xl p-6"  
        style={{  
          backgroundColor: "#FFFFFF",  
          border: "1px solid #EBE8E2",  
          boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)",  
        }}  
      >  
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 mb-6 text-center sm:text-left">  
          <img  
            src="https://ui-avatars.com/api/?name=IEEE+SPS+Admin&background=7C6FEF&color=fff"  
            alt="Super Admin"  
            className="w-28 h-28 rounded-full"  
          />

          <div>  
            <h2 className="text-2xl font-bold text-[#1C1B22]">Super Admin</h2>

            <p style={{ color: "#8A8578" }}>IEEE SPS System Administrator</p>  
          </div>  
        </div>

        <div className="grid md:grid-cols-2 gap-4">  
          <InfoCard label="Role" value="Super Admin" />

          <InfoCard label="Access Level" value="Full System Access" />

          <InfoCard label="Events" value="Allowed" />

          <InfoCard label="Team" value="Allowed" />

          <InfoCard label="Registrations" value="Allowed" />

          <InfoCard label="Messages" value="Allowed" />

          <InfoCard label="SPS Applications" value="Allowed" />

          <InfoCard label="Admin Management" value="Allowed" />  
        </div>  
      </div>  
    );  
  }

  if (!profile) {  
    return <div className="p-6 text-[#8A8578]">Loading Profile...</div>;  
  }

  const isExternal = profile.isExternal;

  const member = profile.memberId;

  const photo = isExternal  
    ? "https://ui-avatars.com/api/?name=Admin"  
    : member?.photo;

  return (  
    <div  
      className="rounded-xl p-6"  
      style={{  
        backgroundColor: "#FFFFFF",  
        border: "1px solid #EBE8E2",  
        boxShadow: "0 1px 2px rgba(28,27,34,0.04), 0 8px 24px rgba(28,27,34,0.04)",  
      }}  
    >  
      {profile.isPaused && (  
        <div  
          className="mb-6 p-4 rounded-lg"  
          style={{  
            backgroundColor: "#FDEBEB",  
            border: "1px solid #F5D0D0",  
            color: "#DC3D3D",  
          }}  
        >  
          <>  
            <div className="font-semibold text-lg">⚠ Access Restricted</div>

            <div className="mt-2">  
              Your administrative access has been temporarily restricted.  
            </div>

            <div className="mt-3">  
              <strong>Reason:</strong>{" "}  
              {profile.pauseReason || "Temporary Committee Restriction"}  
            </div>  
          </>  
        </div>  
      )}

      <div className="flex flex-col sm:flex-row items-center gap-5 mb-6 text-center sm:text-left">  
        <img  
          src={photo}  
          alt="Profile"  
          className="w-28 h-28 rounded-full object-cover"  
        />

        <div>  
          <h2 className="text-2xl font-bold text-[#1C1B22]">  
            {isExternal ? profile.name : member?.name}  
          </h2>

          <p  
            style={{  
              color: "#8A8578",  
            }}  
          >  
            {isExternal ? profile.role : member?.role}  
          </p>  
        </div>  
      </div>

      <div className="grid md:grid-cols-2 gap-4">  
        {!isExternal && (  
          <>  
            <InfoCard label="Department" value={member?.department} />

            <InfoCard label="Roll Number" value={member?.rollNumber} />

            <InfoCard  
              label="Registration Number"  
              value={member?.registrationNumber}  
            />

            <InfoCard label="Email" value={member?.email} />

            <InfoCard label="Phone" value={member?.phone} />  
          </>  
        )}

        <InfoCard label="Username" value={profile.username} />

        <InfoCard  
          label="Last Login"  
          value={  
            profile.lastLogin  
              ? new Date(profile.lastLogin).toLocaleString()  
              : "Never"  
          }  
        />

        <InfoCard  
          label="Last Password Change"  
          value={  
            profile.lastPasswordChange  
              ? new Date(profile.lastPasswordChange).toLocaleString()  
              : "Never"  
          }  
        />  
      </div>

      <div className="mt-6">  
        <h3 className="font-semibold mb-3 text-[#1C1B22]">Permissions</h3>

        <div className="flex flex-wrap gap-2">  
          {Object.entries(profile.permissions)  
            .filter(([, value]) => value)  
            .map(([key]) => (  
              <span  
                key={key}  
                className="px-3 py-1 rounded-lg text-sm"  
                style={{  
                  backgroundColor: "#EFEBFF",  
                  color: "#6C5FE0",  
                }}  
              >  
                {key}  
              </span>  
            ))}  
        </div>

        <div className="mt-8">  
  <h3 className="font-semibold mb-4 text-[#1C1B22]">  
    Recent Logins  
  </h3>

  <div className="space-y-3">  
    {profile.loginHistory?.length > 0 ? (  
      profile.loginHistory.map(  
        (login: any, index: number) => (  
          <div  
            key={index}  
            className="p-3 rounded-lg"  
            style={{  
              backgroundColor:  
                "#FAF9F7",  
            }}  
          >  
            <div style={{ color: "#1C1B22" }}>  
              {new Date(  
                login.loginAt,  
              ).toLocaleString()}  
            </div>

            <div  
              style={{  
                color: "#8A8578",  
                fontSize: "12px",  
              }}  
            >  
              {login.device}  
            </div>  
          </div>  
        ),  
      )  
    ) : (  
      <div  
        style={{  
          color: "#8A8578",  
        }}  
      >  
        No login history available  
      </div>  
    )}  
  </div>  
</div>  
      </div>  
    </div>  
  );  
};

const InfoCard = ({ label, value }: { label: string; value: any }) => (  
  <div  
    className="p-3 rounded-lg"  
    style={{  
      backgroundColor: "#FAF9F7",  
    }}  
  >  
    <div  
      className="text-xs mb-1"  
      style={{  
        color: "#8A8578",  
      }}  
    >  
      {label}  
    </div>

    <div className="text-[#1C1B22]">{value || "-"}</div>  
  </div>  
);

export default Profile;