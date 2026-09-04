import { useState, type FormEvent } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";

import { StepHeader, type StepHeadingRef } from "./StepHeader";
import styles from "./style.module.css";

export type Companion = {
    id: number;
    name: string;
};

type MembersStepProps = {
    ownerName: string;
    companions: Companion[];
    headingRef: StepHeadingRef;
    onAdd: (name: string) => void;
    onRemove: (companionId: number) => void;
};

export function MembersStep({
    ownerName,
    companions,
    headingRef,
    onAdd,
    onRemove,
}: MembersStepProps) {
    const [companionName, setCompanionName] = useState("");

    const addCompanion = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const name = companionName.trim();
        if (!name) {
            return;
        }

        onAdd(name);
        setCompanionName("");
    };

    return (
        <section>
            <StepHeader
                title="누구와 함께 가나요?"
                description="본인은 자동으로 포함돼요. 동행은 나중에도 추가할 수 있습니다."
                headingRef={headingRef}
            />
            <ul className={styles.memberList} aria-label="여행 인원">
                <li>
                    <span className={styles.memberIcon}>
                        <UserRound aria-hidden="true" />
                    </span>
                    <div>
                        <strong>{ownerName}</strong>
                        <span>본인</span>
                    </div>
                </li>
                {companions.map((companion, index) => (
                    <li key={companion.id}>
                        <span className={styles.memberNumber}>{index + 2}</span>
                        <div>
                            <strong>{companion.name}</strong>
                            <span>동행 {index + 1}</span>
                        </div>
                        <button
                            className={styles.removeButton}
                            type="button"
                            aria-label={`${companion.name} 삭제`}
                            onClick={() => onRemove(companion.id)}
                        >
                            <Trash2 aria-hidden="true" />
                        </button>
                    </li>
                ))}
            </ul>
            <form className={styles.memberForm} onSubmit={addCompanion}>
                <div className={styles.field}>
                    <label htmlFor="companion-name">동행 이름</label>
                    <div className={styles.inlineField}>
                        <input
                            id="companion-name"
                            value={companionName}
                            maxLength={30}
                            placeholder="이름 입력"
                            onChange={(event) =>
                                setCompanionName(event.target.value)
                            }
                        />
                        <button type="submit" disabled={!companionName.trim()}>
                            <Plus aria-hidden="true" />
                            추가
                        </button>
                    </div>
                </div>
            </form>
            <p className={styles.hint}>
                같은 이름도 추가할 수 있으며 동행 번호로 구분됩니다.
            </p>
        </section>
    );
}
